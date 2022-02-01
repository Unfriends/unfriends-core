import { Namespace } from "socket.io";
import { Room } from "./entities/Room";
import { GameSocket } from "./GameSocket";
import { ServerSocket } from "./ServerSocket";

/**
 * @description Manage list of rooms
 */
export class RoomsHandler {
    /**
     * Array containing all rooms
     */
    private rooms: Room[] = [];

    constructor(private serverSocket: ServerSocket) { }

    /**
     * Remove a room from list of all rooms
     * @param roomId Room ID to remove
     */
    public removeRoom (roomId: string) {
        this.rooms = this.rooms.filter((r) => r.getId() !== roomId);
    }

    /**
     * Create and add a room to the list of all rooms
     * @param name Name of the room
     */
    public createRoom (name: string, forceId?: string): Room {
        let room: Room = new Room(name, {}, forceId);
        this.rooms.push(room);
        return room;
    }

    /**
     * Return rooms list
     */
    public getRooms (): Room[] {
        return this.rooms;
    }

    /**
     * @return Get the list of public rooms (open & not started)
     */
    public getPublicRooms () {
        return this.rooms.filter(r => !r.isPrivate() && !r.isGameStarted()).map(r => r.getData())
    }

    /**
     * Find a room containing a user
     * @param userId User to find
     * @returns Room, or null if this user isn't present in any room
     */
    public getUserRoom (userId: string) {
        return this.getRooms().find(r => r.isUserPresent(userId))
    }
}
