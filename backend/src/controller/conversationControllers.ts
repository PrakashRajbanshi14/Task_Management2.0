import { Response } from "express";
import { IExtendedRequest } from "../globals/types";
import { Op } from "sequelize";
import User from "../database/models/userModel";

import Conversation from "../database/models/conversationModel";
import Message from "../database/models/messageModel";

import conversationService
  from "../services/conversationService";

import { sendResponse }
  from "../utils/sendResponse";

import { UserRole } from "../globals/types";


class ConversationController {

  // ==========================================
  // Create / Get Conversation
  // ==========================================

  static async createConversation(
    req: IExtendedRequest,
    res: Response,
  ) {

    try {

      const currentUserId =
        req.user?.id;

      if (!currentUserId) {
        return sendResponse(
          res,
          401,
          "Please login!",
        );
      }


      const {
        userId,
      } = req.body;


      if (!userId) {
        return sendResponse(
          res,
          400,
          "User ID is required!",
        );
      }


      if (
        currentUserId === userId
      ) {
        return sendResponse(
          res,
          400,
          "You cannot create a conversation with yourself!",
        );
      }


      // ==========================================
      // Find receiver
      // ==========================================

      const receiver =
        await User.findByPk(userId);


      if (!receiver) {
        return sendResponse(
          res,
          404,
          "User not found!",
        );
      }


      // ==========================================
      // Validate roles
      // ==========================================

      const currentUser =
        await User.findByPk(
          currentUserId,
        );


      if (!currentUser) {
        return sendResponse(
          res,
          404,
          "Current user not found!",
        );
      }


      const allowedRoles = [
        UserRole.Employee,
        UserRole.ProjectManager,
        UserRole.Admin,
      ];


      if (
        !allowedRoles.includes(
          currentUser.role as UserRole,
        ) ||
        !allowedRoles.includes(
          receiver.role as UserRole,
        )
      ) {

        return sendResponse(
          res,
          403,
          "Chat is not allowed for these users!",
        );

      }


      // ==========================================
      // Check valid combination
      // ==========================================

      const roles = [
        currentUser.role,
        receiver.role,
      ];


      const isEmployeePM =
        roles.includes(UserRole.Employee) &&
        roles.includes(UserRole.ProjectManager);


      const isEmployeeAdmin =
        roles.includes(UserRole.Employee) &&
        roles.includes(UserRole.Admin);


      const isPMAdmin =
        roles.includes(UserRole.ProjectManager) &&
        roles.includes(UserRole.Admin);


      if (
        !isEmployeePM &&
        !isEmployeeAdmin &&
        !isPMAdmin
      ) {

        return sendResponse(
          res,
          403,
          "These users are not allowed to chat with each other!",
        );

      }


      // ==========================================
      // Get or create conversation
      // ==========================================

      const conversation =
        await conversationService
          .getOrCreateConversation(
            currentUserId,
            userId,
          );

      const conversationWithUsers =
        await Conversation.findByPk(
          conversation.id,
          {
            include: [
              {
                model: User,
                as: "userOne",
                attributes: [
                  "id",
                  "fullName",
                  "email",
                  "profileImage",
                  "role",
                ],
              },
              {
                model: User,
                as: "userTwo",
                attributes: [
                  "id",
                  "fullName",
                  "email",
                  "profileImage",
                  "role",
                ],
              },
            ],
          },
        );


      return sendResponse(
        res,
        200,
        "Conversation ready",
        conversationWithUsers || conversation,
      );


    } catch (error) {

      console.error(
        "Create Conversation Error:",
        error,
      );


      return sendResponse(
        res,
        500,
        "Failed to create conversation",
      );

    }
  }


  // ==========================================
  // Get all conversations
  // ==========================================

static async getMyConversations(
  req: IExtendedRequest,
  res: Response,
) {

  try {

    const userId = req.user?.id;


    if (!userId) {
      return sendResponse(
        res,
        401,
        "Please login!",
      );
    }


    const conversations =
      await Conversation.findAll({

        where: {

          [Op.or]: [
            {
              userOneId: userId,
            },

            {
              userTwoId: userId,
            },
          ],

        },

        order: [
          ["updatedAt", "DESC"],
        ],

        include: [
          {
            model: User,
            as: "userOne",
            attributes: [
              "id",
              "fullName",
              "email",
              "profileImage",
              "role",
            ],
          },
          {
            model: User,
            as: "userTwo",
            attributes: [
              "id",
              "fullName",
              "email",
              "profileImage",
              "role",
            ],
          },
          {
            model: Message,
            as: "messages",
            separate: true,
            limit: 1,
            order: [["createdAt", "DESC"]],
          },
        ],

      });


    return sendResponse(
      res,
      200,
      "Conversations fetched successfully",
      conversations,
    );


  } catch (error) {

    console.error(
      "Get Conversations Error:",
      error,
    );


    return sendResponse(
      res,
      500,
      "Failed to fetch conversations",
    );

  }
}
}


export default ConversationController;
