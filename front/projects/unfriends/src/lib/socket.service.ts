import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Socket } from './socket';


@Injectable()
export class SocketService {
    socket: Socket | undefined;

    constructor(private apiService: ApiService) { }

    public onSocketReady(url: string): Observable<any> {
        return new Observable((observer) => {
            let token = this.apiService.getToken()
            if (token == null) {
                observer.error("Token not set");
                observer.complete();
            } else {
                this.socket = new Socket(url, token);

                let roomCloseTimout = setTimeout(() => {
                    observer.error("This room doesn't exists !");
                    observer.complete();
                }, 3000);

                this.socket.once('hello', (res?: any) => {
                    observer.next(res);
                    clearTimeout(roomCloseTimout);
                    observer.complete();
                });
            }

        });
    }

    public leaveRoom() {
        console.log("leave room");

        if (this.socket)
            this.socket.disconnect();
        else
            throw new Error(`Can't leave a room, socket is not initialized`)
    }

    public getSocket() {
        if (!this.socket)
            throw new Error(`Can't getSocket, socket is not initialized`)
        return this.socket;
    }

}