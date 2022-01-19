import { Namespace, Socket } from "socket.io";
import { Room } from "./entities/Room";
import { User } from "./entities/User";
import AuthMiddleware from "./middlewares/AuthMiddleware";
import InRoomMiddleware from "./middlewares/InRoomMiddleware";
import { LeaveReason } from "./models/LeaveReason";
import { RefuseReason } from "./models/RefuseReason";
import rdiff from 'recursive-diff'

interface Message {
    user: any;
    content: string;
}

export abstract class GameSocket {

    private reconnectDelay: number = 4000;
    private waitingUsers: { user: User; timeout: NodeJS.Timeout }[] = [];

    protected messages: Message[] = [];
    private oldLobbyState: any
    private oldGameConfigState: any;
    private oldGameState: any;


    constructor(private namespace: Namespace, private room: Room) {
        this.setupMiddlewares();
        this.setupSocketListeners();
        this.onCreate();
        this.autoSyncStates(500)
    }

    protected getRoom() {
        return this.room
    }

    /**
     * All custom event for the game (and lobby, if you want to add events)
     */
    abstract registerGameListeners(user: User): void;
    /**
     * All custom event for the game (and lobby, if you want to add events)
     */
    abstract registerLobbyListeners(user: User): void;
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
     * Setup a user socket when he join, or reconnect
     * @param user User to setup
     */
    private setupUser(user: User) {
        this.registerListeners(user);
        // TODO register event only on converned state
        this.registerGameListeners(user);
        this.registerLobbyListeners(user);

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
    private async onJoin(user: User) {
        // console.log("First join");

        // user.getData()
        this.setupUser(user);
        if (!this.getRoom().isGameStarted()) {
            this.getRoom().addUser(user);
            if (!this.getRoom().getLeaderId()) {
                this.getRoom().changeOptions({ leaderId: user.getId() });
            }
        }
    }

    /**
     * When a user reconnect after a brutal leave
     */
    private onReconnect(user: User): void {
        // console.log("Reconnect");
        this.setupUser(user);
    }

    /**
     * When a user reconnection seat expire
     */
    private onReconnectExpired(user: User): void {
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
    private onLeave(user: User, reason: LeaveReason): void {
        // console.log('user left');

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
    private onRefuse(socket: Socket, reason: RefuseReason): void {
        switch (reason) {
            case RefuseReason.ConnectedOnOtherRoom:
                socket.emit("welcome", { error: "ConnectedOnOtherRoom" });
                break;
            case RefuseReason.ConnectedInThisRoomOnOtherTab:
                socket.emit("welcome", { error: "ConnectedInThisRoomOnOtherTab" });
                break;
            default:
                socket.emit("welcome", { error: `UnknowError ${reason}` });
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
            this.checkLobbyUpdate()
            this.checkGameConfigUpdate()
            // this.checkGameStateUpdate()
        }, interval)

    }

    private checkGameConfigUpdate() {
        let state = this.getGameConfig()

        let diff = rdiff.getDiff(this.oldGameConfigState, state)
        if (diff.length > 0) {
            this.oldGameConfigState = JSON.parse(JSON.stringify(state));
            this.broadcast("game:config:update", diff);
        }
    }

    private checkGameStateUpdate() {
        let state = this.getGameState()

        let diff = rdiff.getDiff(this.oldGameState, state)
        if (diff.length > 0) {
            this.oldGameState = JSON.parse(JSON.stringify(state));
            this.broadcast("game:state:update", diff);
        }
    }

    private checkLobbyUpdate() {
        let state = this.getLobbyState()

        let diff = rdiff.getDiff(this.oldLobbyState, state)
        if (diff.length > 0) {
            this.oldLobbyState = JSON.parse(JSON.stringify(state));
            this.broadcast("lobby:state:update", diff);
        }
    }

    protected getLobbyState() {
        return { messages: this.messages, ...this.getRoom().getData() }
    }

    abstract getGameConfig(): any
    abstract getGameState(): any

    // Setup
    private registerListeners(user: User) {

        // STATES SYNC
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

    /**
     * Setup room event
     */
    private setupSocketListeners() {
        this.namespace.on("connection", async (client: Socket) => {
            if (!client.data.refused) {
                let userId: string = client.data.userId;
                let user: User;

                if (this.isWaitingForReconnection(userId)) {
                    user = this.getAndRemoveWaitingUser(userId);
                    user.setSocket(client);
                    this.onReconnect(user);
                } else {
                    user = new User(userId);
                    user.setSocket(client);
                    await user.fetchData()
                    this.onJoin(user);
                }

                // console.log("Connect user " + userId + " in room " + this.getId());

                client.on("disconnect", (data) => {
                    if (data === "client namespace disconnect") {
                        this.onLeave(user, LeaveReason.Left);
                    } else if (data === "transport close") {
                        this.onLeave(user, LeaveReason.Brutal);
                    } else {
                        console.error("Unknow left reason ! ", data);
                        this.onLeave(user, LeaveReason.Unknow);
                    }
                });
            } else {
                console.log("Client refused");
            }
        });
    }

    // abstract onCreate(): void;
    // abstract onReconnect(user: User): void;
    // abstract onReconnectExpired(user: User): void;
    // abstract onJoin(user: User): void;
    // abstract onLeave(user: User, leaveReason: LeaveReason): void;
    // abstract onRefuse(socket: Socket, refuseReason: RefuseReason): void;
    // abstract onDestroy(): void;

    // GETTERS / SETTERS

    public getId() {
        return this.namespace.name;
    }

    public setReconnectDelay(delay: number) {
        this.reconnectDelay = delay;
    }


    protected waitForUserReconnection(user: User) {
        let timeout = setTimeout(() => {
            this.getAndRemoveWaitingUser(user.getId());
            this.onReconnectExpired(user);
        }, this.reconnectDelay);
        this.waitingUsers.push({ user, timeout });
    }

    private getAndRemoveWaitingUser(id: string): User {
        let seat = this.waitingUsers.filter((user) => user.user.getId() === id)[0];
        this.waitingUsers = this.waitingUsers.filter(
            (user) => user.user.getId() !== id
        );

        clearTimeout(seat.timeout);
        return seat.user;
    }

    public isWaitingForReconnection(id: string) {
        return this.waitingUsers.some((seat) => seat.user.getId() === id);
    }

    // Destroy namespace and free memory
    public async destroyNamespace() {
        // TODO
        this.onDestroy();
    }

    /**
     * Middlewares are used when user join the namespace
     * Functions are executed once for each user
     */
    private setupMiddlewares() {
        // TODO
        // Is user auth ?
        this.namespace.use(AuthMiddleware);

        // Is user already in room ?
        // this.namespace.use((socket: Socket, next: any) => {
        //   InRoomMiddleware(socket, next, this);
        // });
    }

    public broadcast(event: string, data?: any) {
        this.namespace.emit(event, data);
    }

}