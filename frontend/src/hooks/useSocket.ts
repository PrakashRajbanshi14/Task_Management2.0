import { useEffect } from "react";

import {
  callEventReceived,
  clearChat,
  messageReceived,
  messagesRead,
  socketErrorReceived,
  socketStatusChanged,
  userStoppedTyping,
  userTyping,
} from "../store/chatSlice";
import {
  clearNotifications,
  fetchNotifications,
  notificationReceived,
} from "../store/notificationSlice";
import { connectSocket, disconnectSocket, getSocket, type AppSocket } from "../services/socket";
import { useAuth } from "./useAuth";

export const useSocket = (): AppSocket => {
  const { dispatch, isAuthenticated, user } = useAuth();
  const socket = getSocket();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      dispatch(socketStatusChanged("disconnected"));
      dispatch(clearChat());
      dispatch(clearNotifications());
      return;
    }

    const client = connectSocket();

    const handleConnect = () => {
      dispatch(socketStatusChanged("connected"));
    };
    const handleDisconnect = () => {
      dispatch(socketStatusChanged("disconnected"));
    };
    const handleConnectError = (error: Error) => {
      dispatch(socketErrorReceived(error.message || "Unable to connect to real-time updates."));
    };

    client.on("connect", handleConnect);
    client.on("disconnect", handleDisconnect);
    client.on("connect_error", handleConnectError);
    client.on("new_notification", (notification) => dispatch(notificationReceived(notification)));
    client.on("new_message", (message) => dispatch(messageReceived(message)));
    client.on("new_message_notification", ({ message }) => dispatch(messageReceived(message)));
    client.on("user_typing", (data) => dispatch(userTyping(data)));
    client.on("user_stopped_typing", (data) => dispatch(userStoppedTyping(data)));
    client.on("messages_read", (data) => dispatch(messagesRead(data)));
    client.on("chat_error", ({ message }) => dispatch(socketErrorReceived(message)));
    client.on("call:error", ({ message }) => dispatch(socketErrorReceived(message)));

    client.on("call:incoming", (data) => dispatch(callEventReceived({ event: "call:incoming", data })));
    client.on("call:started", (data) => dispatch(callEventReceived({ event: "call:started", data })));
    client.on("call:offer", (data) => dispatch(callEventReceived({ event: "call:offer", data })));
    client.on("call:answer", (data) => dispatch(callEventReceived({ event: "call:answer", data })));
    client.on("call:ice-candidate", (data) =>
      dispatch(callEventReceived({ event: "call:ice-candidate", data })),
    );
    client.on("call:accepted", (data) => dispatch(callEventReceived({ event: "call:accepted", data })));
    client.on("call:rejected", (data) => dispatch(callEventReceived({ event: "call:rejected", data })));
    client.on("call:missed", (data) => dispatch(callEventReceived({ event: "call:missed", data })));
    client.on("call:ended", (data) => dispatch(callEventReceived({ event: "call:ended", data })));
    client.on("call:busy", (data) => dispatch(callEventReceived({ event: "call:busy", data })));
    client.on("screen-share:started", (data) =>
      dispatch(callEventReceived({ event: "screen-share:started", data })),
    );
    client.on("screen-share:stopped", (data) =>
      dispatch(callEventReceived({ event: "screen-share:stopped", data })),
    );

    void dispatch(fetchNotifications());

    return () => {
      client.off("connect", handleConnect);
      client.off("disconnect", handleDisconnect);
      client.off("connect_error", handleConnectError);
      client.off("new_notification");
      client.off("new_message");
      client.off("new_message_notification");
      client.off("user_typing");
      client.off("user_stopped_typing");
      client.off("messages_read");
      client.off("chat_error");
      client.off("call:error");
      client.off("call:incoming");
      client.off("call:started");
      client.off("call:offer");
      client.off("call:answer");
      client.off("call:ice-candidate");
      client.off("call:accepted");
      client.off("call:rejected");
      client.off("call:missed");
      client.off("call:ended");
      client.off("call:busy");
      client.off("screen-share:started");
      client.off("screen-share:stopped");
    };
  }, [dispatch, isAuthenticated, user]);

  return socket;
};
