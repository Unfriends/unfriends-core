import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ApiService } from './api.service';
import { GameService } from './game.service';
import { SocketService } from './socket.service';
import { UnfriendsComponent } from './unfriends.component';



@NgModule({
  declarations: [
    UnfriendsComponent
  ],
  providers: [
    ApiService,
    GameService,
    SocketService
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  exports: [
    UnfriendsComponent
  ]
})
export class UnfriendsModule { }
