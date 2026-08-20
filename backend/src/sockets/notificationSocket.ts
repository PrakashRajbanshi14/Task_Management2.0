import { Server } from "socket.io";

import User from "../database/models/userModel";


export const registerNotificationSocket = (
  io: Server,
) => {

  io.on("connection", (socket) => {

    const user = socket.data.user;


    if (!user) {
      return;
    }


    console.log(
      "Notification socket ready for:",
      user.id
    );


    // ==========================================
    // Join personal user room
    // ==========================================

    socket.join(
      `user:${user.id}`
    );


    console.log(
      `User ${user.id} joined notification room`
    );


    // ==========================================
    // Disconnect
    // ==========================================

    socket.on(
      "disconnect",
      () => {

        console.log(
          "User disconnected:",
          user.id
        );

      }
    );

  });
};