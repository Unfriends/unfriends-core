import { Namespace, Server, Socket } from "socket.io";
import { RoomsHandler } from "./RoomsHandler";
import { createServer } from "http";
import { Room, GameSocket } from "..";
import { Bot } from "./entities/Bot";

/**
 * Server socket is the global socket server.
 * It handle all the rooms, and the gestion of them.
 * It also communicate with the matchmaker server
 */
export class ServerSocket {
    private rooms = new RoomsHandler()
    protected isMatchmakerUp = false

    private server: Server

    constructor(private gameSocketType: new (namespace: Namespace, room: Room) => GameSocket, PORT: number, options?: { origin?: string[], debug?: boolean }) {
        // Setup IO server
        const httpServer = createServer();
        options = { origin: [], debug: false, ...options }
        this.server = new Server(httpServer, {
            cors: {
                origin: options.origin,
                credentials: true
            }
        });
        if (options.debug) {
            let room = this.createRoom("debug", "debug")
            console.log("Room debug initialize. access it with /debug");

            for (let i = 0; i < 4; i++) {
                room.addUser(new Bot("bot-" + i))
            }
        }
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


        // Listen for matchmaker
        this.server.of('/matchmaker').on("connection", (socket) => {
            // TODO add a middlewar, to verify if we're with a authorize matchmaker server
            if (this.isMatchmakerUp) {
                console.log("A matchmaker is already connected, but we can communicate with multiple instance, i guess");
            }

            console.log("Matchmaker is connected");
            this.isMatchmakerUp = true

            socket.on('disconnect', data => {
                console.log("Matchmaker has disconnected:", data);
                this.isMatchmakerUp = false
            })

            // On Events

            socket.on('getRooms', (cb) => {
                cb(this.rooms.getPublicRooms())
            })

            socket.on('createRoom', ({ name }, cb) => {
                let room = this.createRoom(name)
                cb(room.getId())
            })

            socket.on('removeRoom', (id, cb) => {
                this.rooms.removeRoom(id)
                cb(true)
            })

            // Emit

            socket.emit('getRooms', this.rooms.getPublicRooms())
        });
    }

    protected createRoom(name: string, forceId?: string) {
        let room = this.rooms.createRoom(name, forceId)
        room.attachSocket(new this.gameSocketType(this.server.of(room.getId()), room))
        return room
    }

    public getUserRoom(userId: string) {
        return this.rooms.getUserRoom(userId)
    }

    // public removeRoom(id: string) {
    //     this.rooms.removeRoom(id)
    //     this.io.emit('removeRoom', id)
    // }


}