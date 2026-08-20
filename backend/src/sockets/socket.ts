import {
  Server,
} from "socket.io";

import {
  Server as HttpServer,
} from "http";

import {
  socketAuthMiddleware,
} from "../middlewares/socketAuthMiddleware";

import {registerNotificationSocket} from "./notificationSocket"

import {
  registerChatSocket,
} from "./chatSocket";


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
  // Socket Authentication
  // ==========================================

  io.use(
    socketAuthMiddleware,
  );


  // ==========================================
  // Register Chat
  // ==========================================

  registerChatSocket(io);


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