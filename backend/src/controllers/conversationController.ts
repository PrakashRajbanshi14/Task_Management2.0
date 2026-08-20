import { Request, Response } from "express";

import Conversation from "../database/models/conversationModel";
import Message from "../database/models/messageModel";
import Project from "../database/models/projectModel";
import User from "../database/models/userModel";
import { IExtendedRequest } from "../globals/types";
import { UserRole } from "../globals/types";

class ConversationController {
  // ==========================================
  // CREATE CONVERSATION
  // ==========================================

  async createConversation(req: IExtendedRequest, res: Response) {
    try {
      const { employeeId, projectId } = req.body;

      // --------------------------------------
      // Validation
      // --------------------------------------

      if (!employeeId || !projectId) {
        return res.status(400).json({
          message: "Employee ID and Project ID are required",
        });
      }

      // Check if project exists
      const project = await Project.findByPk(projectId);

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      // Check if employee exists and is actually an employee
      const employee = await User.findByPk(employeeId);

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      if (employee.role !== UserRole.Employee) {
        return res.status(400).json({
          message: "User is not an employee",
        });
      }

      // Get current user
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const currentUser = await User.findByPk(currentUserId);

      if (!currentUser) {
        return res.status(404).json({
          message: "Current user not found",
        });
      }

      // Check if current user is ProjectManager or Admin
      if (
        currentUser.role !== UserRole.ProjectManager &&
        currentUser.role !== UserRole.Admin
      ) {
        return res.status(403).json({
          message:
            "Only Project Managers can create conversations with employees",
        });
      }

      // Check if conversation already exists
      const existingConversation = await Conversation.findOne({
        where: {
          projectManagerId: currentUserId,

          employeeId,

          projectId,
        },
      });

      if (existingConversation) {
        return res.status(409).json({
          message: "Conversation already exists with this employee",
        });
      }

      // Create conversation
      const conversation = await Conversation.create({
        projectManagerId: currentUserId,

        employeeId,

        projectId,
      });

      return res.status(201).json({
        message: "Conversation created successfully",

        conversation,
      });
    } catch (error) {
      console.error("Create Conversation Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET ALL CONVERSATIONS OF USER
  // ==========================================

  async getUserConversations(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // Check if user exists
      const user = await User.findByPk(userId as string);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Get conversations based on user role
      let conversations;

      if (user.role === UserRole.ProjectManager || user.role === UserRole.Admin) {
        // PM can see all conversations they initiated
        conversations = await Conversation.findAll({
          where: {
            projectManagerId: userId as string,
          },

          include: [
            {
              model: User,

              as: "projectManager",

              attributes: [
                "id",

                "userName",

                "email",

                "fullName",

                "profileImage",
              ],
            },

            {
              model: User,

              as: "employee",

              attributes: [
                "id",

                "userName",

                "email",

                "fullName",

                "profileImage",
              ],
            },

            {
              model: Project,

              as: "project",

              attributes: ["id", "name"],
            },
          ],

          order: [["updatedAt", "DESC"]],
        });
      } else if (user.role === UserRole.Employee) {
        // Employee can see all conversations initiated with them
        conversations = await Conversation.findAll({
          where: {
            employeeId: userId as string,
          },

          include: [
            {
              model: User,

              as: "projectManager",

              attributes: [
                "id",

                "userName",

                "email",

                "fullName",

                "profileImage",
              ],
            },

            {
              model: User,

              as: "employee",

              attributes: [
                "id",

                "userName",

                "email",

                "fullName",

                "profileImage",
              ],
            },

            {
              model: Project,

              as: "project",

              attributes: ["id", "name"],
            },
          ],

          order: [["updatedAt", "DESC"]],
        });
      }

      return res.status(200).json({
        conversations,
      });
    } catch (error) {
      console.error("Get User Conversations Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET CONVERSATION BY ID
  // ==========================================

  async getConversationById(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;

      // Get conversation with all messages
      const conversation = await Conversation.findByPk(conversationId as string, {
        include: [
          {
            model: User,

            as: "projectManager",

            attributes: [
              "id",

              "userName",

              "email",

              "fullName",

              "profileImage",
            ],
          },

          {
            model: User,

            as: "employee",

            attributes: [
              "id",

              "userName",

              "email",

              "fullName",

              "profileImage",
            ],
          },

          {
            model: Project,

            as: "project",

            attributes: ["id", "name"],
          },

          {
            model: Message,

            as: "messages",

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

            order: [["createdAt", "ASC"]],
          },
        ],
      });

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }

      return res.status(200).json({
        conversation,
      });
    } catch (error) {
      console.error("Get Conversation Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // DELETE CONVERSATION
  // ==========================================

  async deleteConversation(req: IExtendedRequest, res: Response) {
    try {
      const { conversationId } = req.params;

      // Get current user
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      // Get conversation
      const conversation = await Conversation.findByPk(conversationId as string);

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }

      // Check if user is a participant of the conversation
      if (
        conversation.projectManagerId !== currentUserId &&
        conversation.employeeId !== currentUserId
      ) {
        return res.status(403).json({
          message: "You do not have permission to delete this conversation",
        });
      }

      // Delete all messages in conversation
      await Message.destroy({
        where: {
          conversationId: conversationId as string,
        },
      });

      // Delete conversation
      await conversation.destroy();

      return res.status(200).json({
        message: "Conversation deleted successfully",
      });
    } catch (error) {
      console.error("Delete Conversation Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET CONVERSATION BETWEEN PM AND EMPLOYEE
  // ==========================================

  async getConversationBetween(req: Request, res: Response) {
    try {
      const { projectManagerId, employeeId, projectId } = req.params;

      const conversation = await Conversation.findOne({
        where: {
          projectManagerId,

          employeeId,

          projectId,
        },

        include: [
          {
            model: User,

            as: "projectManager",

            attributes: [
              "id",

              "userName",

              "email",

              "fullName",

              "profileImage",
            ],
          },

          {
            model: User,

            as: "employee",

            attributes: [
              "id",

              "userName",

              "email",

              "fullName",

              "profileImage",
            ],
          },

          {
            model: Project,

            as: "project",

            attributes: ["id", "name"],
          },
        ],
      });

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }

      return res.status(200).json({
        conversation,
      });
    } catch (error) {
      console.error("Get Conversation Between Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new ConversationController();
