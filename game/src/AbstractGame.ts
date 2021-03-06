import { PlayerData } from "@unfriends/utils";
import { EventEmitter } from "stream";
import { AbstractPlayer } from "./AbstractPlayer";
export type Newable<T> = { new(...args: any[]): T; };
export abstract class AbstractGame<Configuration, GameState, Player extends AbstractPlayer> extends EventEmitter {
    protected players: Player[] = []

    constructor(protected configuration: Configuration, protected playerType: Newable<Player>) {
        super()
        configuration = this.generateConfigAccordingToPlayers(2)
    }

    /**
     * @return Should return true if the game is over
     */
    public abstract isGameOver (): boolean
    /**
     * @return Get the game configuration according to the number of player
     */
    public abstract generateConfigAccordingToPlayers (count: number): Configuration;
    /**
     * @return Call this method to stop the game, with the end reason
     */
    protected abstract stop (data?: any): void;
    /**
     * @return Called on game start. Init all game infos here
     */
    protected abstract onInitGame (): void;
    /**
     * @return Get a representation of the state of each player at the end of the game
     */
    public abstract getLeaderboard (): any[]

    /**
     * Get a player from his ID
     * @param id Id of player
     * @returns Player, or throw an error
     */
    public getPlayer (id: string): Player {
        let player = this.players.find(p => p.getId() === id)
        if (!player)
            throw new Error(`Player not found: ${id}`)
        return player
    }
    /**
     * @description List of players present in game
    */
    public getPlayers () {
        return this.players;
    }
    /**
     * @description List of players, with private informations
     */
    public getPlayersPrivateInfos () {
        return this.players.map(p => { return { id: p.getId(), infos: p.getPrivateInfos() } })
    }

    /**
     * @description List of players, with public informations
     */
    public getPlayersInfos () {
        return this.players.map(p => { return { id: p.getId(), infos: p.getPublicInfos() } })
    }

    protected async giveSuccess(player: AbstractPlayer, key: string){
        if(await player.giveSuccess(key)){
            this.emit('success', {player: player.getId(), success: key})
            return true
        } else {
            return false
        }
    }

    /**
     * @description Get private infos of a player
     * @param id Id of player
     */
    public getPlayerPrivateInfosFromId (id: string) {
        return this.getPlayer(id).getPrivateInfos()
    }

    /**
     * Call this method to start the game
     * @param players Player who will play
     */
    public start (players: PlayerData[]) {
        this.players = players.map(p => new this.playerType(p))
        this.onInitGame()
    }


    /**
     * @return Return current game configuration
     */
    public getConfiguration (): Configuration {
        return this.configuration
    }

    /**
     * Set game config. You can set your own, or use @generateConfigAccordingToPlayers() method to generate a configuration
     */
    public setConfiguration (config: Configuration) {
        return this.configuration = config
    }

    /**
     * Players are in state by default
     * @returns Public state game
     */
    abstract getState (): GameState;
}