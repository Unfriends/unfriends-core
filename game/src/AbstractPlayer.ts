import { PlayerData } from "@unfriends/utils";
import axios from "axios";

export abstract class AbstractPlayer {


    constructor(protected data: PlayerData) {
    }

    /**
     * @description Get private infos for a player
     */
    abstract getPrivateInfos (): any;

    /**
     * @description Get public infos for a player
     */
    abstract getPublicInfos (): any;

    public getData () {
        return this.data
    }

    public getId () {
        return this.data.id
    }

    public async giveSuccess (key: string) {
        if (process.env.ENV === 'dev') {
            return true
        }
        try {
            //Check if user has success
            let checkReq = await axios.get(`${process.env.API_URL}/api/user/${this.getId()}/success/${key}`)
            if (checkReq.data == true) {
                return false
            }
            await axios.post(`${process.env.API_URL}/api/user/${this.getId()}/success/${key}`, {}, {
                headers: {
                    'apiKey': process.env.API_PRIVILEGED_KEY || 'API_PRIVILEGED_KEY env isn\'t set'
                }
            })
            return true
        } catch (error) {
            return false
        }
    }
}