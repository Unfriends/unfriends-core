import { Socket } from "socket.io";
import { PlayerData } from "@unfriends/utils";
import axios from "axios";

export class User {
  private socket: Socket | undefined;
  protected data: PlayerData | undefined;

  constructor(private id: string) {
    this.id = id;
  }

  /**
   * Get user data from API, using id
   * @returns empty Promise
   */
  public async fetchData () {
    return axios.get(`${process.env.API_URL}/api/user/infos/${this.id}`).then((res: any) => {
      this.data = res.data;
    }).catch(err => {
      // console.error("API Unreachable. Set fake data");
      this.data = { pseudo: "CrazyDeveloper", id: this.id }
    })
  }

  public setData (data: PlayerData) {
    this.data = data
  }

  public getId () {
    return this.id;
  }

  public setSocket (socket: Socket) {
    this.socket = socket;
  }

  public emit (event: string, params?: any) {
    if (!this.socket)
      throw new Error(`User socket is not defined on (emit) event`)
    this.socket.emit(event, params)
  }

  public on (event: string, callback: (...args: any[]) => void) {
    if (!this.socket)
      throw new Error(`User socket is not defined on (on) event`)
    this.socket.on(event, callback)
  }

  public sendNotification (notif: any) {
    if (!this.socket)
      throw new Error(`User socket is not defined on (sendNotification) event`)
    this.socket.emit('unfriend:notification', notif)
  }

  public sendSuccess (key: string) {
    if (!this.socket)
      throw new Error(`User socket is not defined on (sendSuccess) event`)
    this.socket.emit('unfriend:success', key)
  }

  public getData () {
    if (!this.data)
      throw new Error("User data's not ready. Should not append")
    if (!this.socket)
      throw new Error(`User socket is not defined. on getData.`)

    return {
      connected: this.socket.connected,
      ...this.data,
    };
  }
}
