import { Namespace } from "socket.io";
import { GameSocket } from "../GameSocket";
import { RoomOptions } from "../models/RoomOptions";
import { User } from "./User";

export class Room {
  private id: string;
  private users: User[] = [];
  private gameStarted: boolean = false;
  private options: RoomOptions
  private gameSocket: GameSocket | undefined

  constructor(
    name: string,
    options?: RoomOptions
  ) {
    this.id = Math.random().toString(36).substr(2, 9).toUpperCase();

    // TODO DEFAULT VALUES, TO CHANGE IN FUTURE
    this.options = { name, maxPlayer: 8, private: false, ...options };
  }

  public attachSocket(gameSocket: GameSocket) {
    this.gameSocket = gameSocket
    this.gameSocket.attachRoom(this)
  }

  public getSocket() {
    if (!this.gameSocket)
      throw new Error("NOT POSSIBLE :)")
    return this.gameSocket
  }

  /**
   * @description Is the room visible ?
   */
  public isPrivate() {
    return this.options?.private;
  }

  /**
   * @description Get the random generated ID of the room (Should be unique)
   */
  public getId() {
    return this.id;
  }

  /**
   * @description True if we're in "game state", False if we're in lobby
   */
  public isGameStarted() {
    return this.gameStarted;
  }

  /**
   * @description Set to true when the game is currently started
   */
  public setGameStarted(start: boolean) {
    this.gameStarted = start;
  }

  public getOptions() {
    return this.options;
  }

  public changeOptions(options: Partial<RoomOptions>) {
    this.options = { ...this.options, ...options };
  }

  public setLeader(userId: string) {
    this.options.leaderId = userId
  }

  /**
   * Get room name
   */
  public getName() {
    return this.options.name;
  }

  /**
   * Get users present in the room
   */
  public getUsers() {
    return this.users;
  }

  public getUserFromId(id: string) {
    return this.users.find(u => u.getId() === id)
  }

  /**
   * @description Create a format sendable to front end client
   * @returns array of rooms availables
   */
  public getData() {
    return {
      // name: this.getName(),
      id: this.getId(),
      users: this.users.map(u => u.getData()),
      options: this.getOptions(),
    };
  }

  /**
   * Add a user to room
   * @param userId User ID to add
   */
  public addUser(user: User) {
    if (this.isUserPresent(user.getId())) {
      throw new Error(`Try to add a user already present in room. UserID: ${user.getId()}, roomId: ${this.getId()}`);
    } else {
      this.users.push(user);
    }
  }

  /**
   * Remove a user from room
   * @param userId User ID to add
   */
  public removeUser(user: User) {
    if (!this.isUserPresent(user.getId())) {
      throw new Error(`Try to remove a user not present in room. UserID: ${user.getId()}, roomId: ${this.getId()}`)
    } else {
      this.users = this.users.filter((u) => u.getId() !== user.getId());
    }
  }

  /**
   * Check if a user is present on room
   * @param userId User ID to check
   * @returns true if user present in room
   */
  public isUserPresent(userId: string) {
    return this.users.some((user) => user.getId() === userId);
  }
}
