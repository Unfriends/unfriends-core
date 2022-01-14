import { AbstractPlayer } from "./AbstractPlayer";
import { AbstractPublicInfos } from "./AbstractPublicInfos";

export abstract class AbstractGame<Configuration, GameState, Player extends AbstractPlayer> {
    protected players: Map<string, Player> = new Map<string, Player>();
    protected gameState: GameState | false = false

    constructor(protected configuration: Configuration) {

    }

    // TODO: get config for players and getPlayerInfosFromId ?

    // public addPlayer(player: Player) {
    //     this.players.set(player.getData().id, player)
    // }

    // public removePlayer(id: string) {
    //     this.players.delete(id)
    // };

    public getPlayer(id: string): Player {
        let player = this.players.get(id)
        if (!player)
            throw new Error(`Player not found: ${id}`)
        return player
    }
    /**
     * @description List of players present in game
    */
    public getPlayers() {
        return this.players;
    }

    /**
     * @description List of players public informations
    */
    public getPlayersInfos() {
        let infos = [];
        for (const player of this.players) {
            infos.push(player[1].getPublicInfos());
        }
        return infos;
    }

    /**
   * @description Get private infos of a player
   * @param id Id of player
   */
    public getPlayerInfosFromId(id: string) {
        let player: Player | undefined = this.players.get(id);
        if (player != undefined) {
            return player.getPrivateInfos()
        }
        throw new Error("Player id not found")
    }

    abstract isGameOver(): boolean

    public start(players: Player[]) {
        for (const player of players) {
            // TODO get player data somewhere
            // this.players.set(player.getData().id, player)
        }
        this.initGame()
    }
    protected abstract stop(data?: any): void;
    protected abstract initGame(): void;
    /**
     * @return Get a representation of the state of each player at the end of the game
     */
    public abstract getLeaderboard(): any[]

    /**
     * @return Return current game configuration
     */
    public getConfiguration(): Configuration {
        return this.configuration
    }

    /**
     * 
     * @returns 
     */
    public setConfiguration(config: Configuration) {
        return this.configuration = config
    }

    /**
     * @return Return current game state, or false if we're in lobby
     */
    public getState(): GameState | false {
        return this.gameState
    }
}