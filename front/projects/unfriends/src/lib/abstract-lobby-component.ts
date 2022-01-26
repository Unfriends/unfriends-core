import { Component } from "@angular/core";
import { AbstractUnfriendComponent } from "./abstract-unfriend.component";
import { Message } from "./entities/Message";
import { RoomOptions } from "./entities/RoomOptions";

@Component({ template: '' })
export abstract class AbstractLobbyComponent<Config> extends AbstractUnfriendComponent<Config> {
  room: {
    id: string;
    users: {
      pseudo: string;
      connected: boolean;
      id: string
    }[];
    options: RoomOptions;
    messages: Message[];
  } | undefined;

  game: Config | undefined

  setupListeners() {
    let onLobbyStateSubscription = this.gameService
      .onLobbyState()
      .subscribe(this.socketOnLobbyState);
    let onLobbyStateChangeSubscription = this.gameService
      .onLobbyStateChange()
      .subscribe(this.socketOnLobbyStateChange);
    let onGameStartSubscription = this.gameService
      .onStartGame()
      .subscribe(this.socketOnGameStart);
    let onKickedSubscription = this.gameService
      .onKick()
      .subscribe(this.socketOnKicked);

    this.subs.add(onLobbyStateSubscription);
    this.subs.add(onLobbyStateChangeSubscription);
    this.subs.add(onKickedSubscription);
    this.subs.add(onGameStartSubscription);


    this.gameService.askLobbyState()
  }

  // EVENTS

  private socketOnLobbyState = (state: any) => {
    console.log("get socketOnLobbyState", state);
    this.room = state
  };

  private socketOnLobbyStateChange = (state: any) => {
    if (!this.room) return
    console.log("get socketOnLobbyStateChange", state);
    this.room = state
  };

  private socketOnGameStart = () => {
    this.router.navigate([this.room_id, 'game']);
  };

  private socketOnKicked = () => {
    this.gameService.disconnect();
    this.router.navigate(['/']);
  };

  // private socketOnRemoveUser = (id: string) => {
  //   if (!this.room)
  //     throw new Error("Room not init socketOnRemoveUser")
  //   let index = this.getUserIndexFromId(id);
  //   if (index !== -1) {
  //     this.room.users.splice(index, 1);
  //   }
  // };

  // FUNCTIONS

  public setRoomVisible() {
    if (!this.room)
      throw new Error("Room not init setRoomVisible")
    this.gameService.setPrivate(!this.room.options.private);
  }

  public giveLeadership(userId: string) {
    this.gameService.giveLeadership(userId);
  }

  public kickPlayer(userId: string) {
    this.gameService.kickPlayer(userId);
  }

  public startGame() {
    this.gameService.startGame();
  }

  // Computed

  get isLeader() {
    if (!this.room)
      throw new Error("Room not init isLeader")
    return this.room.options.leaderId == this.apiService.getId();
  }

  // Utils

  private getUserIndexFromId(id: string) {
    if (!this.room)
      throw new Error("Room not init getUserIndexFromId")
    if (this.room.users && this.room.users.length > 0)
      for (let i = 0; i < this.room.users.length; i++) {
        if (this.room.users[i].id === id) {
          return i;
        }
      }
    return -1;
  }
}
