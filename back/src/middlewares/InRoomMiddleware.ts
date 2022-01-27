import { Socket } from "socket.io";
import { RefuseReason } from "../models/RefuseReason";
import { ServerSocket } from "../ServerSocket";

/**
 * Use to check if the user is already in a room
 */
export default function InRoomMiddleware(
  socket: Socket,
  next: any,
  serverSocket: ServerSocket,
) {
  let userId = socket.data.userId;
  let refused = false;
  let userRoom = serverSocket.getUserRoom(userId);


  if (userRoom) {
    if (userRoom.getId() !== userRoom.getSocket().getId()) {
      userRoom.getSocket().onRefuse(socket, RefuseReason.ConnectedInThisRoomOnOtherTab)
      refused = true
    } else if (!userRoom.getSocket().isWaitingForReconnection(userId)) {
      userRoom.getSocket().onRefuse(socket, RefuseReason.ConnectedInThisRoomOnOtherTab)
      refused = true
    }
  }
  socket.data.refused = refused;

  next();
}
