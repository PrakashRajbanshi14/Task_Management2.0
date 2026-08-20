import { Request, Response } from "express";

import Message from "../database/models/messageModel";
import Conversation from "../database/models/conversationModel";
import User from "../database/models/userModel";
import { IExtendedRequest } from "../globals/types";

class MessageController {
  // ==========================================
  // CREATE MESSAGE
  // ==========================================

  async createMessage(req: IExtendedRequest, res: Response) {
    try {
      const { conversationId } = req.params;

      const { message: messageText } = req.body;

      // Validation
      if (!messageText || messageText.trim() === "") {
        return res.status(400).json({
          message: "Message text is required",
        });
      }

      // Check if conversation exists
      const conversation = await Conversation.findByPk(
        conversationId as string
      );

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }

      // Get current user
      const senderId = req.user?.id;
      if (!senderId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      // Check if user is a participant of the conversation
      if (
        conversation.projectManagerId !== senderId &&
        conversation.employeeId !== senderId
      ) {
        return res.status(403).json({
          message: "You do not have permission to send messages in this conversation",
        });
      }

      // Create message
      const newMessage = await Message.create({
        conversationId: conversationId as string,

        senderId,

        message: messageText.trim(),

        isRead: false,

        readAt: null,
      });

      // Update conversation timestamp by touching it
      await conversation.save();

      // Fetch message with sender details
      const message = await Message.findByPk(newMessage.id, {
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
      });

      return res.status(201).json({
        message: "Message sent successfully",

        data: message,
      });
    } catch (error) {
      console.error("Create Message Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET ALL MESSAGES OF CONVERSATION
  // ==========================================

  async getConversationMessages(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;

      // Check if conversation exists
      const conversation = await Conversation.findByPk(
        conversationId as string
      );

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }

      // Get all messages with pagination support
      const { page = 1, limit = 50 } = req.query;
      const offset = ((page as number) - 1) * (limit as number);

      const messages = await Message.findAll({
        where: {
          conversationId: conversationId as string,
        },

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

        order: [["createdAt", "DESC"]],

        limit: limit as number,

        offset,
      });

      // Get total count
      const total = await Message.count({
        where: {
          conversationId: conversationId as string,
        },
      });

      return res.status(200).json({
        messages: messages.reverse(),

        pagination: {
          page,

          limit,

          total,

          pages: Math.ceil(total / (limit as number)),
        },
      });
    } catch (error) {
      console.error("Get Messages Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // MARK MESSAGE AS READ
  // ==========================================

  async markAsRead(req: Request, res: Response) {
    try {
      const { messageId } = req.params;

      // Get message
      const message = await Message.findByPk(messageId as string);

      if (!message) {
        return res.status(404).json({
          message: "Message not found",
        });
      }

      // Update message
      await message.update({
        isRead: true,

        readAt: new Date(),
      });

      return res.status(200).json({
        message: "Message marked as read",
      });
    } catch (error) {
      console.error("Mark as Read Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // MARK ALL MESSAGES AS READ
  // ==========================================

  async markAllAsRead(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Check if conversation exists
      const conversation = await Conversation.findByPk(
        conversationId as string
      );

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }

      // Update all unread messages
      await Message.update(
        {
          isRead: true,

          readAt: new Date(),
        },

        {
          where: {
            conversationId: conversationId as string,

            isRead: false,
          },
        }
      );

      return res.status(200).json({
        message: "All messages marked as read",
      });
    } catch (error) {
      console.error("Mark All As Read Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // DELETE MESSAGE
  // ==========================================

  async deleteMessage(req: IExtendedRequest, res: Response) {
    try {
      const { messageId } = req.params;

      // Get message
      const message = await Message.findByPk(messageId as string);

      if (!message) {
        return res.status(404).json({
          message: "Message not found",
        });
      }

      // Check if user is the sender
      if (message.senderId !== req.user?.id) {
        return res.status(403).json({
          message: "You can only delete your own messages",
        });
      }

      // Delete message
      await message.destroy();

      return res.status(200).json({
        message: "Message deleted successfully",
      });
    } catch (error) {
      console.error("Delete Message Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET UNREAD MESSAGES COUNT
  // ==========================================

  async getUnreadCount(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;

      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Get conversation
      const conversation = await Conversation.findByPk(
        conversationId as string
      );

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }

      // Count unread messages for the user
      const unreadCount = await Message.count({
        where: {
          conversationId: conversationId as string,

          isRead: false,
        },
      });

      return res.status(200).json({
        unreadCount,
      });
    } catch (error) {
      console.error("Get Unread Count Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new MessageController();
