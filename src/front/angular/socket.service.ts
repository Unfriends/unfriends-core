import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket } from './socket';

const fakeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWQiOiJ5b3lvLWlkIiwiaWF0IjoxNTE2MjM5MDIyfQ.tudLnNN4dHlv_rbxhQnGqqv_O5Lg0aMPji6n-twNghQ";

@Injectable()
export class SocketService {
    socket: Socket | undefined;

    public onSocketReady(url: string): Observable<any> {
        return new Observable((observer) => {
            this.socket = new Socket(url, fakeJwt);

            let roomCloseTimout = setTimeout(() => {
                observer.error("This room doesn't exists !");
                observer.complete();
            }, 3000);

            this.socket.once('hello', (res?: any) => {
                observer.next(res);
                clearTimeout(roomCloseTimout);
                observer.complete();
            });
        });
    }

    public leaveRoom() {
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