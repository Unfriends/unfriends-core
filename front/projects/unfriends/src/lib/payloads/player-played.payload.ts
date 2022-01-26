import { CardType } from '../entities/card-type';

export interface PlayerPlayedPayload {
  targetId: string;
  card: CardType;
}
