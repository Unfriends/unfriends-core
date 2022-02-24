import { Namespace, Server, Socket } from "socket.io";
import { io, Socket as s } from "socket.io-client";
import { RoomsHandler } from "./RoomsHandler";
import { createServer } from "http";
import { Bot } from "./entities/Bot";
import { Newable } from "./newable.type";
import { GameSocket } from "./GameSocket";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { Room } from "./entities/Room";

interface Config {
    game: string;
    color: string;
    icon: string;
}

/**
 * Server socket is the global socket server.
 * It handle all the rooms, and the gestion of them.
 * It also communicate with the matchmaker server
 */
export class ServerSocket {

    private rooms = new RoomsHandler(this)

    private server: Server
    static MatchmakerServer: s

    constructor(private gameSocketType: Newable<GameSocket<any>>, options: Config, ioServer?: Server) {
        let front = process.env.APP_URL || "http://localhost:4000"
        let PORT = process.env.SOCKET_PORT || '4001'

        // Setup IO server
        if (!ioServer) {
            const httpServer = createServer();
            this.server = new Server(httpServer, {
                cors: {
                    origin: [front],
                    credentials: true
                }
            });
            httpServer.listen(PORT);

            httpServer.on('error', (e: any) => {
                if (e.code === 'EADDRINUSE') {
                    console.log(`Port ${PORT} in use, retrying...`);
                    setTimeout(() => {
                        httpServer.close();
                        httpServer.listen(PORT);
                    }, 5000);
                } else {
                    console.log(e);
                }
            });

            httpServer.on('listening', () => {
                console.log(`Server listening on ${PORT}`);
            });
        } else {
            this.server = ioServer
        }

        if (process.env.ENV === 'dev') {
            let room = this.createRoom(`Debug room - ${options.game}`, `debug`)
            console.log(`Room debug initialize. access it with /debug`);

            for (let i = 0; i < 4; i++) {
                try {
                    room.addUser(new Bot("bot-" + i))
                } catch (error) {

                }
            }
        }

        // Connect to matchmaker
        ServerSocket.MatchmakerServer = io(process.env.MATCHMAKER_SOCKET + '/game')

        console.log("Trying to connect to matchmaker..");
        ServerSocket.MatchmakerServer.on("connect", () => {
            console.log("Connected to matchmaker");
            ServerSocket.MatchmakerServer.emit('config', { ...options, front })
            this.broadcastRoomToMatchmaker()
        });


        // On Events

        ServerSocket.MatchmakerServer.on('getRooms', (cb: any) => {
            cb(this.rooms.getPublicRooms())
        })

        ServerSocket.MatchmakerServer.on('createRoom', ({ name }: any, cb: any) => {
            let room = this.createRoom(name)
            cb(room.getId())
        })

        // ServerSocket.MatchmakerServer.on('removeRoom', (id, cb) => {
        //     this.rooms.removeRoom(id)
        //     cb(true)
        // })


    }

    public emitToMatchmaker (event: string, data?: any) {
        ServerSocket.MatchmakerServer.emit(event, data)
    }

    public broadcastRoomToMatchmaker () {
        this.emitToMatchmaker('getRooms', this.rooms.getPublicRooms())
    }

    protected createRoom (name: string, forceId?: string) {
        let room = this.rooms.createRoom(name, forceId)
        room.attachSocket(new this.gameSocketType(this.server.of(room.getId()), room))
        return room
    }

    public getUserRoom (userId: string) {
        return this.rooms.getUserRoom(userId)
    }

    static updateRoom (room: Room) {
        ServerSocket.MatchmakerServer.emit("updateRoom", room.getData())
    }

    static deleteRoom (room: Room) {
        ServerSocket.MatchmakerServer.emit("deleteRoom", room.getData())
    }

    // public removeRoom(id: string) {
    //     this.rooms.removeRoom(id)
    //     this.io.emit('removeRoom', id)
    // }


}