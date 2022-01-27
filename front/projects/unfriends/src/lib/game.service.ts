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

    // Unfriend defaults events Events

    /**
     * When the user is kicked from lobby
     */
    public onKick(): Observable<any> {
        return this.on('lobby:kicked');
    }

    /*     public onLobbyMessage(): Observable<Message> {
            return this.on<Message>('lobby:message');
        } */

    /*     public onLobbyState() {
            return this.on<LobbyState<Config>>('lobby:state')
        } */

    public onLobbyStateChange() {
        return this.on<State[]>('lobby:state:update')
    }

    /*     public onAddUser(): Observable<User> {
            return this.on<User>('lobby:add-user');
        } */

    /*     public onRemoveUser(): Observable<string> {
            return this.on<string>('lobby:remove-user');
        } */

    /*     public onGameConfig() {
            return this.on<Config>('game:config');
        } */

    public onGameConfigChanged() {
        return this.on<State[]>('game:config:update');
    }

    /*     public onGameState() {
            return this.on<any>('game:state');
        } */

    public onGameStateChanged() {
        return this.on<State[]>('game:state:update');
    }

    /*     public onPrivateInfos() {
            return this.on<any>('game:private-infos');
        } */

    public onPrivateInfosChanged() {
        return this.on<State[]>('game:private-infos:update');
    }

    public onNotification() {
        return this.on<Config>('notification');
    }

    public onStartGame() {
        return this.on<void>('game:start');
    }

    public onStopGame() {
        return this.on<Config>('game:stop');
    }

    // Admin Commands

    /**
     * User need to own the room
     * @description Set the room private or public
     */
    public setPrivate(isPrivate: boolean) {
        this.emit('lobby:set-private', isPrivate);
    }

    /**
     * @description Send a message in chat
     */
    public emitSendMessage(message: string) {
        this.emit('lobby:send-message', message);
    }

    /**
     * User need to own the room
     * @description Kick a player from the lobby
     */
    public kickPlayer(userId: string) {
        this.emit('lobby:kick', userId);
    }

    /**
     * User need to own the room
     * @description Give lobby leadership to a user
     */
    public giveLeadership(userId: string) {
        this.emit('lobby:give-lead', userId);
    }

    /**
     * User need to own the room
     * @description Go to game state
     */
    public startGame() {
        this.emit('game:start');
    }

    /** 
     * @description Get the state of the lobby (force refresh)
     */
    public askLobbyState(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.emit('lobby:state', (state: any) => {
                resolve(state)
            })
        })
    }

    /** 
     * @description Get the state of the game configuration (force refresh)
     */
    public askGameConfig(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.emit('game:config', (state: any) => {
                resolve(state)
            })
        })
    }

    /** 
     * @description Get the state of the game (force refresh)
     */
    public askGameState(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.emit('game:state', (state: any) => {
                resolve(state)
            })
        })
    }

    /** 
     * @description Get the state of player private information (force refresh)
     */
    public askPrivateInfos(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.emit('game:private-infos', (state: any) => {
                resolve(state)
            })
        })
    }

    // Functions

    /** 
     * @description Force the socket to disconnect
     */
    public disconnect() {
        this.socketService.getSocket().disconnect();
    }
}
