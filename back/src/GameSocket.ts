import { Namespace, Socket } from "socket.io";
import { Room } from "./entities/Room";
import { User } from "./entities/User";
import AuthMiddleware from "./middlewares/AuthMiddleware";
import InRoomMiddleware from "./middlewares/InRoomMiddleware";
import { LeaveReason } from "./models/LeaveReason";
import { RefuseReason } from "./models/RefuseReason";
import * as rdiff from 'recursive-diff'
import { AbstractGame } from "@unfriends/game";
import { Newable } from "./newable.type";
import { ServerSocket } from "..";

interface Message {
    user: any;
    content: string;
}



export abstract class GameSocket<T extends AbstractGame<any, any, any>> {

    private gameType: Newable<T> | null = null
    private gameInstance: T | null = null

    private reconnectDelay: number = 4000;
    private waitingUsers: { user: User; timeout: NodeJS.Timeout }[] = [];

    private messages: Message[] = [];
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

    protected get game (): T {
        if (this.gameInstance)
            return this.gameInstance
        throw new Error("Game object is undefined - game")
    }

    protected setGame (gameType: Newable<T>) {
        this.gameType = gameType
        this.gameInstance = new this.gameType()
    }

    /**
     * Create and replace game instance
     */
    protected resetGame () {
        if (!this.gameType) throw new Error("Game is not assignated  - resetGame")
        this.gameInstance = new this.gameType()
    }

    protected getRoom () {
        return this.room
    }

    public getId () {
        return this.namespace.name;
    }

    public setReconnectDelay (delay: number) {
        this.reconnectDelay = delay;
    }

    /**
     * All custom event for the game
     */
    abstract registerGameListeners (user: User): void;
    /**
     * All custom event for the lobby
     */
    abstract registerLobbyListeners (user: User): void;
    /**
     * Called a user left a game permanently (and will not come back)
     */
    abstract userLeftInGame (user: User): void;
    /**
     * Called when leader click on start button, afyer the game has been initialized
     */
    abstract onStart (): void;
    // abstract onFinish(): void;

    private start () {
        this.game.start(this.getRoom().getUsers().map(p => p.getData()))
        this.onStart()
    }

    /**
     * This function each time a user join or left the lobby. you can auto-set the game config here
     */
    abstract onUserCountChanged (): void

    /**
     * Setup a user socket when he join, or reconnect
     * @param user User to setup
     */
    private setupUser (user: User) {
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
    abstract onCreate (): void;

    /**
     * When a new user join the room
     * @param user New user
     */
    private async onJoin (user: User) {
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
                // FIXME beurk
                ServerSocket.EmitToMatchmaker("updateRoom", this.getRoom().getData())
            } catch (error: any) {
                console.error(error.message);
            }
        }
    }

    /**
     * When a user reconnect after a brutal leave
     */
    private onReconnect (user: User): void {
        // console.log("Reconnect");
        this.setupUser(user);
    }

    /**
     * When a user reconnection seat expire
     */
    private onReconnectExpired (user: User): void {
        // this.removeAndBroadcastUser(user);
        try {
            if (this.getRoom().isGameStarted()) {
                this.userLeftInGame(user);
            }
            this.onLeave(user, LeaveReason.SeatExipred)
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * When a user leave the room
     * @param user Left user
     * @param reason Left reason
     */
    private onLeave (user: User, reason: LeaveReason): void {
        if ((reason === LeaveReason.Brutal || this.getRoom().isGameStarted()) && reason !== LeaveReason.Kicked) {
            this.waitForUserReconnection(user);
        } else {
            try {
                this.getRoom().removeUser(user.getId())
                this.onUserCountChanged()
                ServerSocket.EmitToMatchmaker("updateRoom", this.getRoom().getData())
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
    public onRefuse (socket: Socket, reason: RefuseReason): void {
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
    onDestroy (): void { }

    private autoSyncStates (interval: number) {
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



    private getAllPrivateInfos () {
        return this.game.getPlayersPrivateInfos()
    }
    private getPrivateInfos (id: string) {
        if (this.getRoom().isGameStarted())
            return this.game.getPlayerPrivateInfosFromId(id)
        return null
    }

    private checkPrivatesInfos () {
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


    private checkGameConfigUpdate () {
        let state = this.getGameConfig()

        let diff = rdiff.getDiff(this.oldGameConfigState, state)
        if (diff.length > 0) {
            this.oldGameConfigState = JSON.parse(JSON.stringify(state));
            this.broadcast("game:config:update", state);
        }
    }

    private checkGameStateUpdate () {
        let state = this.getGameState()

        let diff = rdiff.getDiff(this.oldGameState, state)
        if (diff.length > 0) {
            this.oldGameState = JSON.parse(JSON.stringify(state));
            this.broadcast("game:state:update", state);
        }
    }

    private checkLobbyUpdate () {
        let state = this.getLobbyState()

        let diff = rdiff.getDiff(this.oldLobbyState, state)
        if (diff.length > 0) {
            this.oldLobbyState = JSON.parse(JSON.stringify(state));
            this.broadcast("lobby:state:update", state);
            // setTimeout(() => {
            //     ServerSocket.EmitToMatchmaker("updateRoom", this.getRoom().getData())
            // }, 500);
        }
    }

    private getLobbyState () {
        return { messages: this.messages, ...this.getRoom().getData() }
    }
    private getGameConfig () {
        return this.game?.getConfiguration()
    }
    private getGameState () {
        return this.game?.getState()
    }

    // Setup
    private registerListeners (user: User) {

        // STATES SYNC
        user.on("game:state", (callback) => {
            callback(this.getGameState())
        });
        user.on("game:private-infos", (callback) => {
            callback(this.getPrivateInfos(user.getId()))
        });
        user.on("lobby:state", (callback) => {
            callback(this.getLobbyState())
        });
        user.on("game:config", (callback) => {
            callback(this.getGameConfig())
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
                let user = this.getRoom().getUserFromId(userId)
                this.onLeave(user, LeaveReason.Kicked)
            }
        });
        user.on("lobby:give-lead", (userId: string) => {
            if (this.room.isUserAdmin(user)) {
                this.room.setLeader(userId)
            }
            if (process.env.ENV === 'dev') {
                setTimeout(() => {
                    this.room.setLeader(user.getId())
                }, 1500);
            }
        });
        // GAME
        user.on("game:start", () => {
            if (this.room.isUserAdmin(user) && this.canStart()) {
                this.getRoom().setGameStarted(true)
                this.start()
                this.broadcast('game:start')
            }
        });
    }

    abstract canStart (): boolean;


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
    private setupSocketListeners () {
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
                    try {
                        this.onJoin(user);
                    } catch (error: any) {
                        console.log("Client refused", error.message);
                    }
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


    protected getUsers () {
        return this.getRoom().getUsers()
    }

    protected waitForUserReconnection (user: User) {
        let timeout = setTimeout(() => {
            this.getAndRemoveWaitingUser(user.getId());
            this.onReconnectExpired(user);
        }, this.reconnectDelay);
        this.waitingUsers.push({ user, timeout });
    }

    private getAndRemoveWaitingUser (id: string): User {
        let seat = this.waitingUsers.filter((user) => user.user.getId() === id)[0];
        if (!seat) {
            throw new Error("Seat is undefined")
        }
        this.waitingUsers = this.waitingUsers.filter(
            (user) => user.user.getId() !== id
        );

        clearTimeout(seat.timeout);
        return seat.user;
    }

    public isWaitingForReconnection (id: string) {
        return this.waitingUsers.some((seat) => seat.user.getId() === id);
    }

    // Destroy namespace and free memory
    public async destroyNamespace () {
        // TODO
        this.onDestroy();
    }

    /**
     * Middlewares are used when user join the namespace
     * Functions are executed once for each user
     */
    private setupMiddlewares () {
        // TODO
        // Is user auth ?
        this.namespace.use(AuthMiddleware);

        // Is user already in room ?
        // this.namespace.use((socket: Socket, next: any) => {
        //   InRoomMiddleware(socket, next, this);
        // });
    }

    /**
     * @param data End game supplement datas. For instance, it can be the end game reason.
     * These datas will be passed to the client on "onStopGame" event
     * Leaderboard is also send as a supplement
     */
    protected stopGame (data?: any) {
        this.getRoom().setGameStarted(false)
        this.broadcast('game:stop', { ...data, leaderboard: this.game.getLeaderboard() })

        let oldConfig = this.game.getConfiguration()
        this.resetGame()
        this.game.setConfiguration(oldConfig)
    }

    public broadcast (event: string, data?: any) {
        this.namespace.emit(event, data);
    }

    public emitToPlayer (id: string, event: string, data?: any) {
        this.room.getUserFromId(id).emit(event, data)
    }

}