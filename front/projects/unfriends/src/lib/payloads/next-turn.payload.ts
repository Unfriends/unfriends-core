import { CardType } from '../entities/card-type';

export interface NextTurnPayload {
  turn: string,
  announcedCards: CardType[]
  playerInTurn: string[]
}
