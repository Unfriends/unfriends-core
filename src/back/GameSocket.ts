import { Namespace, Socket } from "socket.io";
import { Bot } from "./entities/Bot";
import { Room } from "./entities/Room";
import { User } from "./entities/User";
import { LeaveReason } from "./models/LeaveReason";
import { RefuseReason } from "./models/RefuseReason";
import { NamespaceSocket } from "./NamespaceSocket";


interface Message {
    user: any;
    content: string;
}

export abstract class GameSocket extends NamespaceSocket {
    protected room: Room | undefined
    protected messages: Message[] = [];
    private oldLobbyState: any = []

    constructor(namespace: Namespace) {
        super(namespace)
        this.autoSyncStates(1000)

    }

    attachRoom(room: Room) {
        this.room = room
    }

    protected getRoom() {
        if (this.room)
            return this.room
        throw new Error("Room is not attached")
    }

    /**
     * All custom event for the game (and lobby, if you want to add events)
     */
    abstract registerCustomListeners(user: User): void;
    /**
     * Called a user left a game permanently (and will not come back)
     */
    abstract userLeftInGame(user: User): void;
    /**
     * Called when leader click on start button
     */
    abstract onStart(): void;
    // abstract onFinish(): void;

    /**
     * Setup a user socket when he join
     * @param user User to setup
     */
    private setupUser(user: User) {
        this.registerListeners(user);
        this.registerCustomListeners(user);

        // console.log("User is setup", user.getId(), user.getData());
        // Message sent when user is setup. Confirm client that he can join room
        user.emit("hello", this.getRoom().isGameStarted());
    }

    // EVENT RECEIVERS //

    /**
     * When namespace is ready
     */
    onCreate(): void { }

    /**
     * When a new user join the room
     * @param user New user
     */
    async onJoin(user: User) {
        console.log("First join");

        // user.getData()
        this.setupUser(user);
        if (!this.getRoom().isGameStarted()) {
            this.getRoom().addUser(user);
            if (!this.getRoom().getLeaderId()) {
                this.getRoom().changeOptions({ leaderId: user.getId() });
                // this.broadcastRoomOptions();
            }
            //TODO: maybe wait elsewere
            // setTimeout(() => {
            //     this.broadcastUser(user);
            // }, 250);
        }
    }

    /**
     * When a user reconnect after a brutal leave
     */
    onReconnect(user: User): void {
        console.log("Reconnect");
        this.setupUser(user);
    }

    /**
     * When a user reconnection seat expire
     */
    onReconnectExpired(user: User): void {
        // this.removeAndBroadcastUser(user);
        this.getRoom().removeUser(user.getId())
        if (this.getRoom().isGameStarted()) {
            this.userLeftInGame(user);
        }
    }

    /**
     * When a user leave the room
     * @param user Left user
     * @param reason Left reason
     */
    onLeave(user: User, reason: LeaveReason): void {
        console.log('user left');

        if (reason === LeaveReason.Brutal || this.getRoom().isGameStarted()) {
            this.waitForUserReconnection(user);
        } else {
            this.getRoom().removeUser(user.getId())
        }
    }

    /**
     * When a client has been refused in room
     * @param socket client socket
     * @param reason refuse reason
     */
    onRefuse(socket: Socket, reason: RefuseReason): void {
        switch (reason) {
            case RefuseReason.ConnectedOnOtherRoom:
                socket.emit("welcome", { error: "ConnectedOnOtherRoom" });
                break;
            case RefuseReason.ConnectedInThisRoomOnOtherTab:
                socket.emit("welcome", { error: "ConnectedInThisRoomOnOtherTab" });
                break;
            default:
                socket.emit("welcome", { error: `UnknowError ${RefuseReason.ConnectedOnOtherRoom}` });
                break;
        }

        // if (reason === RefuseReason.RoomStarted) {
        //     socket.emit("welcome", { error: "GameStarted" });
        // }
    }

    /**
     * When the room is destroyed
     */
    onDestroy(): void { }

    // TODO Find a way to only send modified state
    private autoSyncStates(interval: number) {
        setInterval(() => {
            let state = this.getLobbyState()
            this.oldLobbyState = state
        }, interval)

    }

    protected getLobbyState() {
        return { messages: this.messages, ...this.getRoom().getData() }
    }

    abstract getGameConfig(): any
    abstract getGameState(): any

    private broadcastModifiedGameState(state: Partial<any>) {
        this.broadcast("game:state", state);
    }

    // Setup
    private registerListeners(user: User) {

        // STATES SYNC
        // TODO Automatise sync
        user.on("game:state", () => {
            user.emit("game:state", this.getGameState());
        });

        user.on("lobby:state", () => {
            user.emit("lobby:state", this.getLobbyState());
        });
        user.on("game:config", () => {
            user.emit("game:config", this.getGameConfig());
        });

        // LOBBY
        user.on("lobby:send-message", (msg: string) => {
            console.log("lobby:send-message", msg);
            this.messages.push({
                content: msg,
                user: user.getData()
            })
        });
        user.on("lobby:set-private", (isPrivate: boolean) => {
            if (this.room && this.room.getLeaderId() === user.getId()) {
                console.log("lobby:set-private", isPrivate);
                this.room.changeOptions({ private: isPrivate })
            }
        });
        user.on("lobby:kick", (userId: string) => {
            if (this.room && this.room.getLeaderId() === user.getId()) {
                console.log("lobby:kick", userId);
                this.room.removeUser(userId)
            }
        });
        user.on("lobby:give-lead", (userId: string) => {
            if (this.room && this.room.getLeaderId() === user.getId()) {
                console.log("lobby:give-lead", userId);
                this.room.setLeader(userId)
            }
        });
        user.on("lobby:start", () => {
            if (this.room && this.room.getLeaderId() === user.getId()) {
                this.onStart()
            }
        });
    }


    // FUNCTIONS

    addChatMessage(message: Message) {
        this.messages.push(message);
    }

    // private removeAndBroadcastUser(user: User) {
    //     let room = this.getRoom()
    //     room.removeUser(user);
    //     if (room.getUsers().length === 0) {
    //         this.destroyNamespace();
    //     } else {
    //         this.broadcast("removeUser", user.getId());

    //         if (room.getOptions()?.leaderId === user.getId()) {
    //             room.setLeader(room.getUsers()[0].getId());
    //         }

    //         //   this.notifyRoomModified();
    //     }
    //     // this.onUserCountChanged(room.getUsers().length);
    // }
}