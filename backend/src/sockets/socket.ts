import {
  Server,
} from "socket.io";

import {
  Server as HttpServer,
} from "http";

import {
  socketAuthMiddleware,
} from "../middlewares/socketAuthMiddleware";

import {
  registerChatSocket,
} from "./chatSocket";

import {
  registerCallSocket,
} from "./callSocket";


let io: Server;

const isProduction = process.env.NODE_ENV === "production";

const isLocalDevelopmentOrigin = (origin: string) =>
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

const isSocketOriginAllowed = (origin: string | undefined) => {
  if (!origin) {
    return true;
  }

  if (origin === process.env.FRONTEND_URL || origin === process.env.CLIENT_URL) {
    return true;
  }

  return !isProduction && isLocalDevelopmentOrigin(origin);
};


export const initializeSocket = (
  httpServer: HttpServer,
) => {

  io = new Server(
    httpServer,
    {
      cors: {
        origin: (origin, callback) => {
          callback(null, isSocketOriginAllowed(origin));
        },

        credentials: true,

      },

    },
  );


  // ==========================================
  // SOCKET AUTHENTICATION
  // ==========================================

  io.use(
    socketAuthMiddleware,
  );


  // ==========================================
  // CHAT
  // ==========================================

  registerChatSocket(io);


  // ==========================================
  // CALLING
  // ==========================================

  registerCallSocket(io);


  console.log(
    "Socket.IO initialized successfully",
  );


  return io;

};


export const getIO = () => {

  if (!io) {

    throw new Error(
      "Socket.IO has not been initialized.",
    );

  }


  return io;

};
