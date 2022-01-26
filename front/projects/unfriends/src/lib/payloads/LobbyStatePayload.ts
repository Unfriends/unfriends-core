import { LobbyState } from "../entities/LobbyState";
import { Room } from "../entities/Room";

export interface LobbyInfosPayload<Config> {
  lobby: LobbyState<Config>;
  room: Room;
}
