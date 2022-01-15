import { Namespace, Server, Socket } from "socket.io";
import { RoomsHandler } from "./RoomsHandler";
import { instrument } from "@socket.io/admin-ui";
import { createServer } from "http";
import { GameSocket } from "./GameSocket";

/**
 * Server socket is the global socket server.
 * It handle all the rooms, and the gestion of them.
 * It also communicate with the matchmaker server
 */
export class ServerSocket {
    private rooms = new RoomsHandler()
    protected isMatchmakerUp = false

    private server: Server

    constructor(private gameSocketType: new (namespace: Namespace) => GameSocket, PORT: number, options?: { origin?: string[], debug?: boolean }) {
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
            instrument(this.server, {
                auth: false
            });
            let room = this.createRoom("debug")
            console.log("Room debug: " + room.getId());
        }
        httpServer.listen(PORT);


        // Listen for matchmaker
        console.log("Waiting for matchmaker..");
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

    protected createRoom(name: string) {
        let room = this.rooms.createRoom(name)
        room.attachSocket(new this.gameSocketType(this.server.of(room.getId())))
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