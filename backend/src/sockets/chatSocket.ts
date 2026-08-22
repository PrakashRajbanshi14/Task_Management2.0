import { Server } from "socket.io";

import { Op } from "sequelize";

import Conversation from "../database/models/conversationModel";

import Message from "../database/models/messageModel";

import User from "../database/models/userModel";

import conversationService from "../services/conversationService";

import { MessageType, UserRole } from "../globals/types";

import { AuthenticatedSocket } from "./types";

const allowedRoles = [
  UserRole.Employee,
  UserRole.ProjectManager,
  UserRole.Admin,
];

// ==========================================
// Check allowed chat combination
// ==========================================

const canUsersChat = (userOne: User, userTwo: User) => {
  const roles = [userOne.role, userTwo.role];

  const employeePM =
    roles.includes(UserRole.Employee) &&
    roles.includes(UserRole.ProjectManager);

  const employeeAdmin =
    roles.includes(UserRole.Employee) && roles.includes(UserRole.Admin);

  const pmAdmin =
    roles.includes(UserRole.ProjectManager) && roles.includes(UserRole.Admin);

  return employeePM || employeeAdmin || pmAdmin;
};

// ==========================================
// Chat Socket
// ==========================================

export const registerChatSocket = (io: Server) => {
  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.data.user;

    console.log(`Chat connected: ${user.id}`);

    // ==========================================
    // Join personal user room
    // ==========================================

    socket.join(`user:${user.id}`);

    // ==========================================
    // Join Conversation
    // ==========================================

    socket.on("join_conversation", async (conversationId: string) => {
      try {
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,

            [Op.or]: [
              {
                userOneId: user.id,
              },

              {
                userTwoId: user.id,
              },
            ],
          },
        });

        if (!conversation) {
          socket.emit("chat_error", {
            message: "You are not a member of this conversation.",
          });

          return;
        }

        socket.join(`conversation:${conversationId}`);

        socket.emit("conversation_joined", {
          conversationId,
        });
      } catch (error) {
        console.error("Join Conversation Error:", error);
      }
    });

    // ==========================================
    // Leave Conversation
    // ==========================================

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ==========================================
    // Send Message
    // ==========================================

    socket.on(
      "send_message",
      async (data: { conversationId: string; message: string }) => {
        try {
          const { conversationId, message } = data;

          // ==========================================
          // Validate message
          // ==========================================

          if (!conversationId || !message?.trim()) {
            socket.emit("chat_error", {
              message: "Conversation ID and message are required.",
            });

            return;
          }

          // ==========================================
          // Find conversation
          // ==========================================

          const conversation = await Conversation.findByPk(conversationId);

          if (!conversation) {
            socket.emit("chat_error", {
              message: "Conversation not found.",
            });

            return;
          }

          // ==========================================
          // Check sender belongs to conversation
          // ==========================================

          const isParticipant =
            conversation.userOneId === user.id ||
            conversation.userTwoId === user.id;

          if (!isParticipant) {
            socket.emit("chat_error", {
              message: "You are not part of this conversation.",
            });

            return;
          }

          // ==========================================
          // Find receiver
          // ==========================================

          const receiverId =
            conversation.userOneId === user.id
              ? conversation.userTwoId
              : conversation.userOneId;

          const receiver = await User.findByPk(receiverId);

          if (!receiver) {
            socket.emit("chat_error", {
              message: "Receiver not found.",
            });

            return;
          }

          // ==========================================
          // Check roles
          // ==========================================

          if (
            !allowedRoles.includes(user.role as UserRole) ||
            !allowedRoles.includes(receiver.role as UserRole)
          ) {
            socket.emit("chat_error", {
              message: "Chat is not allowed.",
            });

            return;
          }

          if (!canUsersChat(user, receiver)) {
            socket.emit("chat_error", {
              message: "These users cannot chat with each other.",
            });

            return;
          }

          // ==========================================
          // Save message
          // ==========================================

          const savedMessage = await Message.create({
            conversationId,

            senderId: user.id,

            message: message.trim(),
            messageType: MessageType.text,
            isRead: false,

            readAt: null,
          });

          // ==========================================
          // Get complete message
          // ==========================================

          const completeMessage = await Message.findByPk(savedMessage.id, {
            include: [
              {
                model: User,
                as: "sender",

                attributes: ["id", "fullName", "profileImage", "role"],
              },
            ],
          });

          // ==========================================
          // Send to conversation
          // ==========================================

          io.to(`conversation:${conversationId}`).emit(
            "new_message",
            completeMessage,
          );

          // ==========================================
          // Send notification to receiver
          // ==========================================

          io.to(`user:${receiverId}`).emit("new_message_notification", {
            conversationId,

            message: completeMessage,
          });
        } catch (error) {
          console.error("Send Message Error:", error);

          socket.emit("chat_error", {
            message: "Failed to send message.",
          });
        }
      },
    );

    // ==========================================
    // Typing
    // ==========================================

    socket.on("typing", (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        userId: user.id,
      });
    });

    // ==========================================
    // Stop Typing
    // ==========================================

    socket.on("stop_typing", (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit("user_stopped_typing", {
        userId: user.id,
      });
    });

    // ==========================================
    // Mark messages as read
    // ==========================================

    socket.on("mark_messages_read", async (conversationId: string) => {
      try {
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,

            [Op.or]: [
              {
                userOneId: user.id,
              },

              {
                userTwoId: user.id,
              },
            ],
          },
        });

        if (!conversation) {
          return;
        }

        await Message.update(
          {
            isRead: true,

            readAt: new Date(),
          },

          {
            where: {
              conversationId,

              senderId: {
                [Op.ne]: user.id,
              },

              isRead: false,
            },
          },
        );

        io.to(`conversation:${conversationId}`).emit("messages_read", {
          conversationId,

          readBy: user.id,
        });
      } catch (error) {
        console.error("Mark Read Error:", error);
      }
    });

    // ==========================================
    // Disconnect
    // ==========================================

    socket.on("disconnect", () => {
      console.log(`Chat disconnected: ${user.id}`);
    });
  });
};
