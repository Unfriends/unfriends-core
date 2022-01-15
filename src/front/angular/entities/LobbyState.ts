import { Message } from "./Message";

export interface LobbyState<Config> {
  messages: Message[];
  hasStarted: boolean;
  config: Config;
}
