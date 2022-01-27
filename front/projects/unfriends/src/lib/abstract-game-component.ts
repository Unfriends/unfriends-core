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


    this.subs.add(onStopGameSubscription);
    this.subs.add(onGameStateChangedSubscription);
    this.subs.add(onPrivateInfosChangedSubscription);

    this.gameService.askGameState().then(state => {
      this.game = state
    })
    this.gameService.askPrivateInfos().then(state => {
      this.privateInfo = state
    })
  }

  public onStopGame(data: any) {
    throw new Error('You need to override onStopGame method')
  }

  private onGameStateChanged(data: any) {
    if (!this.game) return
    this.game = data//rdiff.applyDiff(this.game, data)
    console.log("onGameStateChanged - new state", this.game);
  }

  private onPrivateInfosChanged(data: any) {
    if (!this.privateInfo) return
    // this.privateInfo = rdiff.applyDiff(this.privateInfo, data)
    this.privateInfo = data
    console.log("onPrivateInfosChanged - new state", this.privateInfo);
  }
}
