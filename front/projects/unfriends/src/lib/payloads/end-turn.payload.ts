import { CardType } from '../entities/card-type';
import { PlayerData } from '@unfriends/utils';

export interface EndTurnPayload {
  turn: string,
  players: {
    cardsLeft: number;
    isEliminated: boolean;
    activeCards: CardType[];
    score: number
    traps: number
    rank: number
    data: PlayerData
  }[],
  infos: { cards: CardType[] }
}
