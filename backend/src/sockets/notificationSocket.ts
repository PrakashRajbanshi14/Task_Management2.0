import { Server } from "socket.io";
import http from "http";

let io: Server;


export const initializeSocket = (
  server: http.Server
) => {

  io = new Server(server, {

    cors: {
      origin:
        process.env.CLIENT_URL,

      credentials: true,
    },

  });


  io.on("connection", (socket) => {

    console.log(
      "Socket connected:",
      socket.id
    );


    // ==========================================
    // Join personal user room
    // ==========================================

    socket.on(
      "join_user_room",
      (userId: string) => {

        if (!userId) {
          return;
        }


        socket.join(
          `user:${userId}`
        );


        console.log(
          `User ${userId} joined notification room`
        );

      }
    );


    // ==========================================
    // Disconnect
    // ==========================================

    socket.on(
      "disconnect",
      () => {

        console.log(
          "Socket disconnected:",
          socket.id
        );

      }
    );

  });


  return io;
};


// ==========================================
// Get Socket.IO instance
// ==========================================

export const getIO = (): Server => {

  if (!io) {

    throw new Error(
      "Socket.IO has not been initialized"
    );

  }

  return io;
};