import { Component, OnInit } from '@angular/core';
import { AbstractUnfriendComponent } from './abstract-unfriend.component';

@Component({ template: '' })
export class AbstractGameComponent<GameState, Configuration> extends AbstractUnfriendComponent<Configuration> implements OnInit {
  game: GameState | undefined
  privateInfo: any

  protected getGame() {
    if (!this.game) throw new Error("Game is not defined")
    return this.game
  }


  ngOnInit() {
    let onStopGameSubscription = this.gameService
      .onStopGame()
      .subscribe((data: any) => {
        this.onStopGame(data);
      });
    let onGameStateSubscription = this.gameService
      .onGameState()
      .subscribe((data: any) => {
        this.onGameState(data);
      });
    let onGameStateChangedSubscription = this.gameService
      .onGameStateChanged()
      .subscribe((data: any) => {
        this.onGameStateChanged(data);
      });
    let onPrivateInfosChangedSubscription = this.gameService
      .onPrivateInfosChanged()
      .subscribe((data: any) => {
        this.onPrivateInfosChanged(data);
      });
    let onPrivateInfosSubscription = this.gameService
      .onPrivateInfos()
      .subscribe((data: any) => {
        this.onPrivateInfos(data);
      });

    this.subs.add(onStopGameSubscription);
    this.subs.add(onGameStateSubscription);
    this.subs.add(onGameStateChangedSubscription);
    this.subs.add(onPrivateInfosSubscription);
    this.subs.add(onPrivateInfosChangedSubscription);

    this.gameService.askGameState()
    this.gameService.askPrivateInfos()
  }

  public onStopGame(data: any) {
    throw new Error('You need to override onStopGame method')
  }

  private onGameState(data: any) {
    console.log("onGameState", data);
    this.game = data
  }

  private onGameStateChanged(data: any) {
    if (!this.game) return
    this.game = data//rdiff.applyDiff(this.game, data)
    console.log("onGameStateChanged - new state", this.game);
  }
  private onPrivateInfos(data: any) {
    console.log("onPrivateInfos", data);
    this.privateInfo = data
  }

  private onPrivateInfosChanged(data: any) {
    if (!this.privateInfo) return
    // this.privateInfo = rdiff.applyDiff(this.privateInfo, data)
    this.privateInfo = data
    console.log("onPrivateInfosChanged - new state", this.privateInfo);
  }
}
