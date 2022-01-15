import { Observable } from 'rxjs';
import { LobbyState } from './entities/LobbyState';
import { Message } from './entities/Message';
import { RoomOptions } from './entities/RoomOptions';
import { User } from './entities/User';
import { SocketService } from './socket.service';

export abstract class AbstractGameService<Config> {
    constructor(protected socketService: SocketService) { }

    // Events

    public onKick(): Observable<any> {
        return this.socketService.getSocket().fromEvent('lobby:kicked');
    }

    public onLobbyMessage(): Observable<Message> {
        return this.socketService.getSocket().fromEvent<Message>('lobby:message');
    }

    public onLobbyState() {
        return this.socketService.getSocket().fromEvent<LobbyState<Config>>('lobby:state')
    }

    public onLobbyStart() {
        return this.socketService
            .getSocket()
            .fromEvent<LobbyState<Config>>('lobby:start');
    }

    public onAddUser(): Observable<User> {
        return this.socketService.getSocket().fromEvent<User>('lobby:add-user');
    }

    public onRemoveUser(): Observable<string> {
        return this.socketService.getSocket().fromEvent<string>('lobby:remove-user');
    }

    public onOptionsChanged() {
        return this.socketService
            .getSocket()
            .fromEvent<RoomOptions>('lobby:options');
    }

    public onGameConfigChanged() {
        return this.socketService.getSocket().fromEvent<Config>('lobby:game-config');
    }

    public onNotification() {
        return this.socketService.getSocket().fromEvent<Config>('lobby:game-config');
    }

    // Commands

    public setPrivate(isPrivate: boolean) {
        this.socketService.getSocket().emit('lobby:set-private', isPrivate);
    }

    public emitSendMessage(message: string) {
        this.socketService.getSocket().emit('lobby:send-message', message);
    }

    public kickPlayer(userId: string) {
        this.socketService.getSocket().emit('lobby:kick', userId);
    }

    public giveLeadership(userId: string) {
        this.socketService.getSocket().emit('lobby:give-lead', userId);
    }

    public startGame() {
        this.socketService.getSocket().emit('lobby:start');
    }

    public askLobbyState() {
        this.socketService.getSocket().emit('lobby:state')
    }

    // Functions

    public disconnect() {
        this.socketService.getSocket().disconnect();
    }
}
