import { Namespace, Socket } from "socket.io";
import { Room } from "./entities/Room";
import { User } from "./entities/User";
import AuthMiddleware from "./middlewares/AuthMiddleware";
import InRoomMiddleware from "./middlewares/InRoomMiddleware";
import { LeaveReason } from "./models/LeaveReason";
import { RefuseReason } from "./models/RefuseReason";
import * as rdiff from 'recursive-diff'

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
    private oldPrivateInfos: {
        id: string;
        infos: any;
    }[] | null = null


    constructor(private namespace: Namespace, private room: Room) {
        this.setupMiddlewares();
        this.setupSocketListeners();
        this.onCreate();
        this.autoSyncStates(300)
    }

    protected getRoom() {
        return this.room
    }

    public getId() {
        return this.namespace.name;
    }

    public setReconnectDelay(delay: number) {
        this.reconnectDelay = delay;
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

    abstract onUserCountChanged(): void

    /**
     * Setup a user socket when he join, or reconnect
     * @param user User to setup
     */
    private setupUser(user: User) {
        this.registerListeners(user);
        // TODO register event only on converned state
        // if (this.room.isGameStarted())
        this.registerGameListeners(user);
        // else
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
            try {
                this.getRoom().addUser(user);
                if (!this.getRoom().getLeaderId()) {
                    this.getRoom().changeOptions({ leaderId: user.getId() });
                }
                this.onUserCountChanged()
            } catch (error) {
                console.error(error);
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
        try {
            this.getRoom().removeUser(user.getId())
            if (this.getRoom().isGameStarted()) {
                this.userLeftInGame(user);
            }
        } catch (error) {
            console.error(error);
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
            try {
                this.getRoom().removeUser(user.getId())
                this.onUserCountChanged()
            } catch (error) {
                console.error(error);
            }
        }
    }

    /**
     * When a client has been refused in room
     * @param socket client socket
     * @param reason refuse reason
     */
    public onRefuse(socket: Socket, reason: RefuseReason): void {
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

    private autoSyncStates(interval: number) {
        // wait for game instance to be created
        setInterval(() => {
            if (this.getRoom().isGameStarted()) {
                this.checkGameStateUpdate()
                this.checkPrivatesInfos()
            } else {
                this.checkGameConfigUpdate()
                this.checkLobbyUpdate()
            }
        }, interval)

    }

    abstract getPrivateInfos(id: string): any;

    abstract getAllPrivateInfos(): {
        id: string;
        infos: any;
    }[];

    private checkPrivatesInfos() {
        let infos = this.getAllPrivateInfos()
        if (!this.oldPrivateInfos) this.oldPrivateInfos = JSON.parse(JSON.stringify(this.getAllPrivateInfos()));
        if (!this.oldPrivateInfos) return

        let changed = false
        for (const info of infos) {
            let opi = this.oldPrivateInfos.find(i => i.id === info.id)
            if (!opi) throw new Error(`IMPOSSIBLE. Fuck it. Player has left game while playing ? ${info.id} not found`)
            let diff = rdiff.getDiff(opi, info)

            if (diff.length > 0) {
                // this.emitToPlayer(info.id, 'game:private-infos:update', diff)
                this.emitToPlayer(info.id, 'game:private-infos:update', info.infos)
                changed = true
            }
        }
        if (changed)
            this.oldPrivateInfos = JSON.parse(JSON.stringify(infos));
    }


    private checkGameConfigUpdate() {
        let state = this.getGameConfig()

        let diff = rdiff.getDiff(this.oldGameConfigState, state)
        if (diff.length > 0) {
            this.oldGameConfigState = JSON.parse(JSON.stringify(state));
            this.broadcast("game:config:update", state);
        }
    }

    private checkGameStateUpdate() {
        let state = this.getGameState()

        let diff = rdiff.getDiff(this.oldGameState, state)
        if (diff.length > 0) {
            this.oldGameState = JSON.parse(JSON.stringify(state));
            this.broadcast("game:state:update", state);
        }
    }

    private checkLobbyUpdate() {
        let state = this.getLobbyState()

        let diff = rdiff.getDiff(this.oldLobbyState, state)
        if (diff.length > 0) {
            this.oldLobbyState = JSON.parse(JSON.stringify(state));
            this.broadcast("lobby:state:update", state);
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
        user.on("game:private-infos", () => {
            user.emit("game:private-infos", this.getPrivateInfos(user.getId()));
        });
        user.on("lobby:state", () => {
            user.emit("lobby:state", this.getLobbyState());
        });
        user.on("game:config", () => {
            user.emit("game:config", this.getGameConfig());
        });

        // LOBBY
        user.on("lobby:send-message", (msg: string) => {
            this.messages.push({
                content: msg,
                user: user.getData()
            })
        });
        user.on("lobby:set-private", (isPrivate: boolean) => {
            if (this.room.isUserAdmin(user)) {
                this.room.changeOptions({ private: isPrivate })
            }
        });
        user.on("lobby:kick", (userId: string) => {
            if (this.room.isUserAdmin(user)) {
                this.room.removeUser(userId)
            }
        });
        user.on("lobby:give-lead", (userId: string) => {
            if (this.room.isUserAdmin(user)) {
                this.room.setLeader(userId)
            }
        });
        // GAME
        user.on("game:start", () => {
            if (this.room.isUserAdmin(user)) {
                this.getRoom().setGameStarted(true)
                this.onStart()
                this.broadcast('game:start')
            }
        });
    }


    // FUNCTIONS

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

    protected stopGame(data?: any) {
        this.getRoom().setGameStarted(false)
        this.broadcast('game:stop', data)
    }

    public broadcast(event: string, data?: any) {
        this.namespace.emit(event, data);
    }

    public emitToPlayer(id: string, event: string, data?: any) {
        this.room.getUserFromId(id).emit(event, data)
    }

}