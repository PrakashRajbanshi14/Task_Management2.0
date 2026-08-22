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


export const initializeSocket = (
  httpServer: HttpServer,
) => {

  io = new Server(
    httpServer,
    {
      cors: {

        origin:
          process.env.CLIENT_URL,

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