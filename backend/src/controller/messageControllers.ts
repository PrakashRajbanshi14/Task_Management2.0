import { Response } from "express";

import { Op } from "sequelize";

import {
  IExtendedRequest,
} from "../globals/types";

import Conversation
  from "../database/models/conversationModel";

import Message
  from "../database/models/messageModel";

import User
  from "../database/models/userModel";

import {
  sendResponse,
} from "../utils/sendResponse";


class MessageController {

  // ==========================================
  // Get messages
  // ==========================================

  static async getMessages(
    req: IExtendedRequest,
    res: Response,
  ) {

    try {

      const userId =
        req.user?.id;

      const {
        conversationId,
      } = req.params;


      if (!userId) {
        return sendResponse(
          res,
          401,
          "Please login!",
        );
      }


      if (!conversationId) {
        return sendResponse(
          res,
          400,
          "Conversation ID is required!",
        );
      }


      // ==========================================
      // Verify conversation
      // ==========================================

      const conversation =
        await Conversation.findOne({

          where: {

            id: conversationId,

            [Op.or]: [
              {
                userOneId: userId,
              },

              {
                userTwoId: userId,
              },
            ],

          },

        });


      if (!conversation) {

        return sendResponse(
          res,
          403,
          "You are not a member of this conversation!",
        );

      }


      // ==========================================
      // Get messages
      // ==========================================

      const messages =
        await Message.findAll({

          where: {
            conversationId,
          },

          include: [
            {
              model: User,
              as: "sender",

              attributes: [
                "id",
                "fullName",
                "profileImage",
                "role",
              ],
            },
          ],

          order: [
            ["createdAt", "ASC"],
          ],

        });


      return sendResponse(
        res,
        200,
        "Messages fetched successfully",
        messages,
      );


    } catch (error) {

      console.error(
        "Get Messages Error:",
        error,
      );


      return sendResponse(
        res,
        500,
        "Failed to fetch messages",
      );

    }
  }


  // ==========================================
  // Mark messages as read
  // ==========================================

  static async markMessagesAsRead(
    req: IExtendedRequest,
    res: Response,
  ) {

    try {

      const userId =
        req.user?.id;

      const {
        conversationId,
      } = req.params;


      if (!userId) {
        return sendResponse(
          res,
          401,
          "Please login!",
        );
      }


      const conversation =
        await Conversation.findOne({

          where: {

            id: conversationId,

            [Op.or]: [
              {
                userOneId: userId,
              },

              {
                userTwoId: userId,
              },
            ],

          },

        });


      if (!conversation) {
        return sendResponse(
          res,
          403,
          "You are not a member of this conversation!",
        );
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
              [Op.ne]: userId,
            },

            isRead: false,

          },
        },

      );


      return sendResponse(
        res,
        200,
        "Messages marked as read",
      );


    } catch (error) {

      console.error(
        "Mark Messages Read Error:",
        error,
      );


      return sendResponse(
        res,
        500,
        "Failed to mark messages as read",
      );

    }
  }
}


export default MessageController;