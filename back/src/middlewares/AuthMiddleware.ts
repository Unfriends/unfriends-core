import jwtDecode from "jwt-decode";
import { Socket } from "socket.io";

/**
 * Middleware used to auth a user when he connect to a namespace
 * It verify the token (generated with the api) and retreive the user ID (from the token)
 * User ID is injected in the socket (we can use socket.data.userId in further request to get user ID)
 */
export default function AuthMiddleware(socket: Socket, next: any) {
  let t = socket.handshake.query.token

  if (t) {
    // FIXME verify signature
    let token: { id: string; iat: number; exp: number } = jwtDecode(t as string)
    const timeDiff = token.exp - token.iat;
    if (timeDiff <= 0) {
      next("Expired token");
    } else {
      // Inject User ID in socket
      socket.data.userId = token.id;
      next();
    }
  } else {
    next("No token provided");
  }
}
