import { AbstractPlayer } from "@unfriends/game";
import { Socket } from "socket.io";
import { User } from "../entities/User";
import { GameSocket } from "../GameSocket";
import { RefuseReason } from "../models/RefuseReason";
import { ServerSocket } from "../ServerSocket";

/**
 * Use to check if the user is already in a room
 */
export default function InRoomMiddleware (
  socket: Socket,
  next: any,
  gameSocket: GameSocket<any>
) {
  let userId = socket.data.userId;
  let refused = false;

  let isWaited = (gameSocket as any).waitingUsers.some((p: any) => p.user.getId() === userId)
  if (isWaited) {
    next();
  } else {
    let isPresent = (gameSocket as any).room.users.some((p: AbstractPlayer) => p.getId() === userId)
    if (isPresent) {
      (gameSocket as any).onRefuse(socket, RefuseReason.ConnectedInThisRoomOnOtherTab)
      refused = true
    }
    socket.data.refused = refused;
    next();
  }


  // let userRoom = (gameSocket as any).getPlayers().map((p: AbstractPlayer) => console.log(p.getId() == socket.data.userId));

  // if (userRoom) {
  //   if (userRoom.getId() !== userRoom.getSocket().getId()) {
  //     userRoom.getSocket().onRefuse(socket, RefuseReason.ConnectedInThisRoomOnOtherTab)
  //     refused = true
  //   } else if (!userRoom.getSocket().isWaitingForReconnection(userId)) {
  //     userRoom.getSocket().onRefuse(socket, RefuseReason.ConnectedInThisRoomOnOtherTab)
  //     refused = true
  //   }
  // }

}
