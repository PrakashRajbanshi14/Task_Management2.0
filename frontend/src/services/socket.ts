import { io, type Socket } from "socket.io-client";

import { getSocketUrl } from "../utils/url";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../types/socket";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export const getSocket = (): AppSocket => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};

export const connectSocket = (): AppSocket => {
  const client = getSocket();

  if (!client.connected) {
    client.connect();
  }

  return client;
};

export const disconnectSocket = () => {
  socket?.disconnect();
};
