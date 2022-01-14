import { Server } from "socket.io";
import { RoomsHandler } from "./RoomsHandler";
import { instrument } from "@socket.io/admin-ui";
import { createServer } from "http";


export abstract class GameSocket {
    private rooms = new RoomsHandler()
    protected isMatchmakerUp = false

    constructor(PORT: number, options?: { origin?: string[], debug?: boolean }) {
        const httpServer = createServer();

        options = { origin: [], debug: false, ...options }


        const io = new Server(httpServer, {
            cors: {
                origin: options.origin,
                credentials: true
            }
        });

        if (options.debug)
            instrument(io, {
                auth: false
            });

        httpServer.listen(PORT);

        console.log("Waiting for matchmaker..");
        io.of('/matchmaker').on("connection", (socket) => {
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
                let room = this.rooms.createRoom(name)
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

    // public removeRoom(id: string) {
    //     this.rooms.removeRoom(id)
    //     this.io.emit('removeRoom', id)
    // }


}