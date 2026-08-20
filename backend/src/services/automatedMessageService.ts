import Conversation from "../database/models/conversationModel";
import Message from "../database/models/messageModel";
import Project from "../database/models/projectModel";
import Shot from "../database/models/projectShotModel";
import User from "../database/models/userModel";

// ==========================================
// AUTOMATED MESSAGE SERVICE
// ==========================================

export class AutomatedMessageService {
  // ==========================================
  // CREATE AUTOMATIC MESSAGE FOR PROJECT ASSIGNMENT
  // ==========================================

  static async sendProjectAssignmentMessage(
    projectManagerId: string,
    employeeId: string,
    projectId: string,
    projectName: string,
    deadline: Date | null
  ) {
    try {
      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        where: {
          projectManagerId,

          employeeId,

          projectId,
        },
      });

      // If not, create new conversation
      if (!conversation) {
        conversation = await Conversation.create({
          projectManagerId,

          employeeId,

          projectId,
        });
      }

      // Format deadline
      const deadlineText = deadline
        ? `by ${new Date(deadline).toLocaleDateString("en-US", {
            year: "numeric",

            month: "long",

            day: "numeric",
          })}`
        : "with no specific deadline";

      // Create automatic message
      const message = await Message.create({
        conversationId: conversation.id,

        senderId: projectManagerId,

        message: `📌 You have been assigned to the project "${projectName}" ${deadlineText}.`,

        isRead: false,

        readAt: null,
      });

      return {
        success: true,

        conversationId: conversation.id,

        messageId: message.id,
      };
    } catch (error) {
      console.error("Send Project Assignment Message Error:", error);

      return {
        success: false,

        error: "Failed to send project assignment message",
      };
    }
  }

  // ==========================================
  // CREATE AUTOMATIC MESSAGE FOR SHOT ASSIGNMENT
  // ==========================================

  static async sendShotAssignmentMessage(
    projectManagerId: string,
    employeeId: string,
    projectId: string,
    shotNumber: number,
    shotTitle: string,
    deadline: Date | null
  ) {
    try {
      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        where: {
          projectManagerId,

          employeeId,

          projectId,
        },
      });

      // If not, create new conversation
      if (!conversation) {
        conversation = await Conversation.create({
          projectManagerId,

          employeeId,

          projectId,
        });
      }

      // Format deadline
      const deadlineText = deadline
        ? `by ${new Date(deadline).toLocaleDateString("en-US", {
            year: "numeric",

            month: "long",

            day: "numeric",
          })}`
        : "with no specific deadline";

      // Create automatic message
      const message = await Message.create({
        conversationId: conversation.id,

        senderId: projectManagerId,

        message: `🎬 You have been assigned to Shot #${shotNumber} - "${shotTitle}" ${deadlineText}.`,

        isRead: false,

        readAt: null,
      });

      return {
        success: true,

        conversationId: conversation.id,

        messageId: message.id,
      };
    } catch (error) {
      console.error("Send Shot Assignment Message Error:", error);

      return {
        success: false,

        error: "Failed to send shot assignment message",
      };
    }
  }

  // ==========================================
  // SEND CUSTOM AUTOMATED MESSAGE
  // ==========================================

  static async sendCustomMessage(
    projectManagerId: string,
    employeeId: string,
    projectId: string,
    messageText: string
  ) {
    try {
      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        where: {
          projectManagerId,

          employeeId,

          projectId,
        },
      });

      // If not, create new conversation
      if (!conversation) {
        conversation = await Conversation.create({
          projectManagerId,

          employeeId,

          projectId,
        });
      }

      // Create message
      const message = await Message.create({
        conversationId: conversation.id,

        senderId: projectManagerId,

        message: messageText,

        isRead: false,

        readAt: null,
      });

      return {
        success: true,

        conversationId: conversation.id,

        messageId: message.id,
      };
    } catch (error) {
      console.error("Send Custom Message Error:", error);

      return {
        success: false,

        error: "Failed to send message",
      };
    }
  }
}
