import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from './socket.service';

@Component({
  selector: 'unfriends',
  template: `
    <p class="text-center">Chargement...</p>
  `,
  styles: [
  ]
})
export class UnfriendsComponent implements OnInit {

  private subs: Subscription = new Subscription();
  private id: string | undefined
  constructor(private route: ActivatedRoute, private socketService: SocketService, private router: Router/* , @Inject('environment') private environment: any */) {

  }

  private joinRoom(gameId: string) {
    let onSocketReadySubscription = this.socketService
      .onSocketReady(gameId)
      .subscribe(
        (started: any) => {
          onSocketReadySubscription.unsubscribe();
          if (started) {
            this.router.navigate([`${this.id}/game`]);
          } else {
            this.router.navigate([`${this.id}/lobby`]);
          }
        },
        (err) => {
          console.error(err);
          this.router.navigate(['/']);
        }
      );
    this.subs.add(onSocketReadySubscription);
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.id = params['id'];

      this.joinRoom(`${"this.environment.gameSocketUrl"}/${this.id}`);
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    // this.socketService.leaveRoom();
  }

}
