import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LobbyState } from './entities/LobbyState';
import { Message } from './entities/Message';
import { State } from './entities/State';
import { User } from './entities/User';
import { SocketService } from './socket.service';

@Injectable()
export class GameService<Config> {
    constructor(protected socketService: SocketService) { }

    public on<T>(event: string) {
        return this.socketService
            .getSocket()
            .fromEvent<T>(event);
    }

    public emit(event: string, data?: any) {
        this.socketService.getSocket().emit(event, data);
    }

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

    public onLobbyStateChange() {
        return this.socketService.getSocket().fromEvent<State[]>('lobby:state:update')
    }

    public onAddUser(): Observable<User> {
        return this.socketService.getSocket().fromEvent<User>('lobby:add-user');
    }

    public onRemoveUser(): Observable<string> {
        return this.socketService.getSocket().fromEvent<string>('lobby:remove-user');
    }

    public onGameConfig() {
        return this.socketService.getSocket().fromEvent<Config>('game:config');
    }

    public onGameConfigChanged() {
        return this.socketService.getSocket().fromEvent<State[]>('game:config:update');
    }

    public onGameState() {
        return this.socketService.getSocket().fromEvent<any>('game:state');
    }

    public onGameStateChanged() {
        return this.socketService.getSocket().fromEvent<State[]>('game:state:update');
    }

    public onPrivateInfos() {
        return this.socketService.getSocket().fromEvent<any>('game:private-infos');
    }

    public onPrivateInfosChanged() {
        return this.socketService.getSocket().fromEvent<State[]>('game:private-infos:update');
    }

    public onNotification() {
        return this.socketService.getSocket().fromEvent<Config>('notification');
    }

    public onStartGame() {
        return this.socketService.getSocket().fromEvent<void>('game:start');
    }

    public onStopGame() {
        return this.socketService.getSocket().fromEvent<Config>('game:stop');
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
        this.socketService.getSocket().emit('game:start');
    }

    public askLobbyState() {
        this.socketService.getSocket().emit('lobby:state')
    }

    public askGameConfig() {
        this.socketService.getSocket().emit('game:config')
    }

    public askGameState() {
        this.socketService.getSocket().emit('game:state')
    }

    public askPrivateInfos() {
        this.socketService.getSocket().emit('game:private-infos')
    }

    // Functions

    public disconnect() {
        this.socketService.getSocket().disconnect();
    }
}
