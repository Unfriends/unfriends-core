import { Subscription } from "rxjs";
import { GameService } from "./game.service";
import { ApiService } from "./api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Component, OnDestroy } from "@angular/core";

@Component({ template: '' })
export class AbstractUnfriendComponent<Config> implements OnDestroy {
    gameConfig: Config | undefined
    room_id: string = ""

    protected subs: Subscription = new Subscription();
    constructor(
        protected gameService: GameService<Config>,
        protected apiService: ApiService,
        protected route: ActivatedRoute,
        protected router: Router
    ) {
        let onGameConfigSubscription = this.gameService
            .onGameConfig()
            .subscribe(this.socketOnGameConfig);

        let onGameConfigChangedSubscription = this.gameService
            .onGameConfigChanged()
            .subscribe(this.socketOnGameConfigChanged);

        this.subs.add(onGameConfigChangedSubscription);
        this.subs.add(onGameConfigSubscription);

        this.gameService.askGameConfig()

        this.route.params.subscribe((params) => {
            this.room_id = params['id'];
        });

        // this.setupListeners();
    }

    // protected abstract setupListeners(): void;

    // EVENTS

    private socketOnGameConfig = (data: Config) => {
        console.log("get socketOnGameConfig", data);
        this.gameConfig = data
    }

    private socketOnGameConfigChanged = (data: any) => {
        if (!this.gameConfig) return
        console.log("get socketOnGameConfigChanged", data);
        this.gameConfig = data
    }

    // Computed

    get config() {
        if (!this.gameConfig) throw new Error("Config not ready")
        return this.gameConfig
    }

    get id() {
        return this.apiService.getId();
    }

    ngOnDestroy(): void {
        this.subs.unsubscribe();
    }

}
