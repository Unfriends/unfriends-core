import { PlayerData } from "@unfriends/utils";

export abstract class AbstractPlayer {


    constructor(protected data: PlayerData) {

    }

    /**
     * @description Get private infos for a player
     */
    abstract getPrivateInfos(): any;

    /**
     * @description Get public infos for a player
     */
    abstract getPublicInfos(): any;

    public getData() {
        return this.data
    }
}