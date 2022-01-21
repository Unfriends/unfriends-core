import { User } from "./User";

export class Bot extends User {

    constructor(id: string) {
        super(id)
        this.fetchData()
    }

    public async fetchData() {
        this.setData({ pseudo: "Bot " + this.getId(), id: this.getId() })
    }

    public emit(event: string, params?: any) {

    }

    public on(event: string, callback: (...args: any[]) => void) {

    }

    public getData() {
        if (!this.data)
            throw new Error("Bot data's not ready. Should not append")

        return {
            connected: false,
            ...this.data,
        };
    }
}
