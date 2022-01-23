import { AbstractPlayer } from "./AbstractPlayer";

export abstract class AbstractGame<Configuration, GameState, Player extends AbstractPlayer> {
    protected players: Player[] = []
    protected gameState: GameState | false = false

    constructor(protected configuration: Configuration) {

    }

    public getPlayer(id: string): Player {
        for (const player of this.players) {
            if (player.getData().id === id) {
                return player
            }
        }
        throw new Error(`Player not found: ${id}`)
    }
    /**
     * @description List of players present in game
    */
    public getPlayers() {
        return this.players;
    }
    /**
     * @description List of players private informations
     */
    public getPlayersPrivateInfos() {
        return this.players.map(p => { return { id: p.getId(), infos: p.getPrivateInfos() } })
    }

    /**
     * @description List of players public informations
     */
    public getPlayersInfos() {
        return this.players.map(p => { return { id: p.getId(), infos: p.getPublicInfos() } })
    }

    /**
     * @description Get private infos of a player
     * @param id Id of player
     */
    public getPlayerPrivateInfosFromId(id: string) {
        return this.getPlayer(id).getPrivateInfos()
    }

    abstract isGameOver(): boolean

    public start(players: Player[]) {
        this.players = players
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