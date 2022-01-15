import { RoomOptions } from './RoomOptions';
import { User } from './User';

export interface Room {
  name: string;
  id: string;
  options: RoomOptions;
  users: User[];
}
