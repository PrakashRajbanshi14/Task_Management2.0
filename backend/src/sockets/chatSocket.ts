import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";

import Message from "../database/models/messageModel";
import Conversation from "../database/models/conversationModel";
import User from "../database/models/userModel";
import { UserRole } from "../globals/types";

interface JwtPayload {
  userId: string;
}

// Store active users
const activeUsers: Map<string, string> = new Map(); // userId -> socketId

export function initializeSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string
      ) as JwtPayload;

      socket.data.userId = decoded.userId;

      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  // Connection event
  io.on("connection", async (socket) => {
    const userId = socket.data.userId;

    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Store active user
    activeUsers.set(userId, socket.id);

    // Broadcast user online status
    io.emit("userOnline", {
      userId,

      status: "online",
    });

    // ==========================================
    // JOIN CONVERSATION ROOM
    // ==========================================

    socket.on("joinConversation", async (conversationId: string) => {
      try {
        // Verify conversation exists and user is a participant
        const conversation = await Conversation.findByPk(conversationId);

        if (!conversation) {
          socket.emit("error", {
            message: "Conversation not found",
          });

          return;
        }

        // Check if user is a participant
        if (
          conversation.projectManagerId !== userId &&
          conversation.employeeId !== userId
        ) {
          socket.emit("error", {
            message: "You are not a participant of this conversation",
          });

          return;
        }

        // Join socket to room
        socket.join(conversationId);

        console.log(`User ${userId} joined conversation ${conversationId}`);

        // Notify other participants
        socket.to(conversationId).emit("userJoined", {
          userId,

          conversationId,
        });
      } catch (error) {
        console.error("Join Conversation Error:", error);

        socket.emit("error", {
          message: "Error joining conversation",
        });
      }
    });

    // ==========================================
    // SEND MESSAGE (REAL-TIME)
    // ==========================================

    socket.on(
      "sendMessage",
      async (
        data: {
          conversationId: string;
          message: string;
        },
        callback
      ) => {
        try {
          const { conversationId, message: messageText } = data;

          // Validate message
          if (!messageText || messageText.trim() === "") {
            callback({
              success: false,

              message: "Message cannot be empty",
            });

            return;
          }

          // Verify conversation exists
          const conversation = await Conversation.findByPk(conversationId);

          if (!conversation) {
            callback({
              success: false,

              message: "Conversation not found",
            });

            return;
          }

          // Check if user is a participant
          if (
            conversation.projectManagerId !== userId &&
            conversation.employeeId !== userId
          ) {
            callback({
              success: false,

              message: "You are not a participant of this conversation",
            });

            return;
          }

          // Create message in database
          const newMessage = await Message.create({
            conversationId,

            senderId: userId,

            message: messageText.trim(),

            isRead: false,

            readAt: null,
          });

          // Fetch message with sender details
          const messageWithSender = await Message.findByPk(newMessage.id, {
            include: [
              {
                model: User,

                as: "sender",

                attributes: [
                  "id",

                  "userName",

                  "fullName",

                  "profileImage",
                ],
              },
            ],
          }) as any;

          // Broadcast message to all participants in conversation
          io.to(conversationId).emit("newMessage", {
            id: messageWithSender?.id,

            conversationId,

            sender: messageWithSender?.sender,

            message: messageWithSender?.message,

            isRead: messageWithSender?.isRead,

            createdAt: messageWithSender?.createdAt,
          });

          // Update conversation timestamp by touching it
          await conversation.save();

          // Callback to sender
          callback({
            success: true,

            message: "Message sent successfully",

            data: {
              id: messageWithSender?.id,

              message: messageWithSender?.message,

              createdAt: messageWithSender?.createdAt,
            },
          });
        } catch (error) {
          console.error("Send Message Error:", error);

          callback({
            success: false,

            message: "Error sending message",
          });
        }
      }
    );

    // ==========================================
    // MARK MESSAGE AS READ (REAL-TIME)
    // ==========================================

    socket.on(
      "markAsRead",
      async (data: { messageId: string; conversationId: string }, callback) => {
        try {
          const { messageId, conversationId } = data;

          // Update message
          await Message.update(
            {
              isRead: true,

              readAt: new Date(),
            },

            {
              where: {
                id: messageId,
              },
            }
          );

          // Broadcast read status to all participants
          io.to(conversationId).emit("messageRead", {
            messageId,

            isRead: true,

            readAt: new Date(),
          });

          callback({
            success: true,

            message: "Message marked as read",
          });
        } catch (error) {
          console.error("Mark as Read Error:", error);

          callback({
            success: false,

            message: "Error marking message as read",
          });
        }
      }
    );

    // ==========================================
    // TYPING INDICATOR
    // ==========================================

    socket.on(
      "typing",
      (data: { conversationId: string; userName: string }) => {
        socket.to(data.conversationId).emit("userTyping", {
          userId,

          userName: data.userName,

          conversationId: data.conversationId,
        });
      }
    );

    socket.on(
      "stopTyping",
      (data: { conversationId: string }) => {
        socket.to(data.conversationId).emit("userStoppedTyping", {
          userId,

          conversationId: data.conversationId,
        });
      }
    );

    // ==========================================
    // LEAVE CONVERSATION ROOM
    // ==========================================

    socket.on("leaveConversation", (conversationId: string) => {
      socket.leave(conversationId);

      socket.to(conversationId).emit("userLeft", {
        userId,

        conversationId,
      });

      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // ==========================================
    // DISCONNECT EVENT
    // ==========================================

    socket.on("disconnect", () => {
      // Remove from active users
      activeUsers.delete(userId);

      // Broadcast user offline status
      io.emit("userOffline", {
        userId,

        status: "offline",
      });

      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
}
