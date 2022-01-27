import { HttpClientModule } from '@angular/common/http';
import { NgModule, Type } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { AbstractGameComponent } from './abstract-game-component';
import { AbstractLobbyComponent } from './abstract-lobby-component';
import { AbstractUnfriendComponent } from './abstract-unfriend.component';
import { ApiService } from './api.service';
import { AppRoutingModule } from './app-routing.module';
import { GameService } from './game.service';
import { SocketService } from './socket.service';
import { UnfriendsComponent } from './unfriends.component';

const routes: Routes = [
  { path: ':id', component: UnfriendsComponent },
  { path: '**', redirectTo: '', },
];

@NgModule({
  declarations: [
    UnfriendsComponent,
    AbstractGameComponent,
    AbstractUnfriendComponent,
    AbstractLobbyComponent
  ],
  providers: [
    ApiService,
    GameService,
    SocketService
  ],
  imports: [
    // RouterModule.forChild(routes),
    // BrowserModule,
    HttpClientModule
  ],
  exports: [
    UnfriendsComponent,
    RouterModule,
    AbstractGameComponent,
    AbstractUnfriendComponent,
    AbstractLobbyComponent
  ]
})
export class UnfriendsModule {
  /* public static forRoot(gameComponent: Type<any>, lobbyComponent: Type<any>) {
    console.log("FOR ROOT UNFRIENDS");

    const routes: Routes = [
      { path: ':id/lobby', component: lobbyComponent },
      { path: ':id/game', component: gameComponent },
      { path: ':id', component: UnfriendsComponent },
      { path: '**', redirectTo: '', },
    ];
    return {
      ngModule: UnfriendsModule,
      import: [RouterModule.forRoot(routes)]
    }
  } */
}
