import { Socket } from "socket.io";
import { PlayerData } from "../models/PlayerData";

export class User {
  private socket: Socket | undefined;
  private data: PlayerData | undefined;

  constructor(private id: string) {
    this.id = id;
    // TODO Fetch api to get data
    this.setData({ pseudo: 'yohan' })
  }

  // public async fetchData() {
  //   // http://localhost:5001/api/user/infos/
  //   return axios.get("https://unfriend-api.yohangastoud.fr/api/user/infos/" + this.id).then((res) => {
  //     this.data = res.data;
  //   })
  // }

  public setData(data: PlayerData) {
    this.data = data
  }

  public getId() {
    return this.id;
  }

  public setSocket(socket: Socket) {
    this.socket = socket;
  }

  public emit(event: string, params?: any) {
    if (!this.socket)
      throw new Error(`User socket is not defined on (emit) event`)
    this.socket.emit(event, params)
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket)
      throw new Error(`User socket is not defined on (on) event`)
    this.socket.on(event, callback)
  }

  public getData() {
    if (!this.data)
      throw new Error("User data's not ready. Should not append")
    if (!this.socket)
      throw new Error(`User socket is not defined. on getData.`)

    return {
      connected: this.socket.connected,
      id: this.getId(),
      ...this.data,
    };
  }
}
