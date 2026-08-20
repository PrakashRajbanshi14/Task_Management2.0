import http from "http";

import app from "./src/app";

import sequelize from "./src/database/connection";

import {
  initializeSocket,
} from "./src/sockets/socket";


const PORT =
  process.env.PORT || 3000;


const startServer = async () => {

  try {

    // ==========================================
    // Database Connection
    // ==========================================

    await sequelize.authenticate();

    console.log(
      "Database Connected Successfully!"
    );


    // ==========================================
    // Database Sync
    // ==========================================

    await sequelize.sync({

      force: true,

      alter: false,

    });

    console.log(
      "Database Synced Successfully!"
    );


    // ==========================================
    // Create HTTP Server
    // ==========================================

    const server =
      http.createServer(app);


    // ==========================================
    // Initialize Socket.IO
    // ==========================================

    initializeSocket(server);


    // ==========================================
    // Start Server
    // ==========================================

    server.listen(
      PORT,
      () => {

        console.log(
          `Server is running on http://localhost:${PORT}`
        );

      }
    );


  } catch (error) {

    console.error(
      "Unable to start server:",
      error
    );

    process.exit(1);

  }
};


startServer();