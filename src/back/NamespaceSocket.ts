import { Namespace, Socket } from "socket.io";
import { User } from "./entities/User";
import AuthMiddleware from "./middlewares/AuthMiddleware";
import InRoomMiddleware from "./middlewares/InRoomMiddleware";
import { LeaveReason } from "./models/LeaveReason";
import { RefuseReason } from "./models/RefuseReason";


export abstract class NamespaceSocket {

    private reconnectDelay: number = 4000;
    private waitingUsers: { user: User; timeout: NodeJS.Timeout }[] = [];

    constructor(private namespace: Namespace) {
        this.setupMiddlewares();
        this.setupSocketListeners();
        this.onCreate();
    }

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
                    this.onJoin(user);
                }

                console.log("Connect user " + userId + " in room " + this.getId());

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

    abstract onCreate(): void;
    abstract onReconnect(user: User): void;
    abstract onReconnectExpired(user: User): void;
    abstract onJoin(user: User): void;
    abstract onLeave(user: User, leaveReason: LeaveReason): void;
    abstract onRefuse(socket: Socket, refuseReason: RefuseReason): void;
    abstract onDestroy(): void;

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