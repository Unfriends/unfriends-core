import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { SocketService } from "./socket.service";



export abstract class AbstractInitComponent {
    private subs: Subscription = new Subscription();

    constructor(private socketUrl: string, private route: ActivatedRoute, private socketService: SocketService, private router: Router) {

    }

    private joinRoom(url: string) {
        let onSocketReadySubscription = this.socketService
            .onSocketReady(url)
            .subscribe(
                (gameType: any) => {
                    onSocketReadySubscription.unsubscribe();
                    // console.log("IN GAME, end userplay");

                },
                (err) => {
                    console.error(err);
                    this.router.navigate(['/']);
                }
            );
        this.subs.add(onSocketReadySubscription);
    }

    onInit(): void {
        this.route.params.subscribe((params: any) => {
            let gameId = params['id'];
            this.joinRoom(`${this.socketUrl}/${gameId}`);
        });
    }

    onDestroy() {
        this.subs.unsubscribe();
        this.socketService.leaveRoom();
    }

}
