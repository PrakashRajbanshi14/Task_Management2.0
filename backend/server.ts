import http from "http";
import app from "./src/app";
import sequelize from "./src/database/connection";
// import { initializeSocket } from "./src/sockets/chatSocket";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database Connected Successfully!");

    await sequelize.sync({
      force: false,
      alter: false,
    });

    console.log("Database Synced Successfully!");

    // Create HTTP server
    // const server = http.createServer(app);

    // Initialize Socket.io
    // initializeSocket(server);

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);

    process.exit(1);
  }
};

startServer();
