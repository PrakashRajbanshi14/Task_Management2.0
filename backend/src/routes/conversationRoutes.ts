import express from "express"

import authMiddleware
    from "../middlewares/authMiddleware"

import accessTo
    from "../middlewares/roleMiddleware"

import { UserRole } from "../globals/types"
import conversationController from "../controllers/conversationController"
import messageController from "../controllers/messageController"


const router = express.Router()


// ==========================================
// CONVERSATION ROUTES
// ==========================================

// Create conversation (PM only)
router.post(

    "/",

    authMiddleware,

    accessTo(
        UserRole.ProjectManager,
        UserRole.Admin
    ),

    (req, res) => conversationController.createConversation(req as any, res)

)


// Get all conversations of user
router.get(

    "/user/:userId",

    authMiddleware,

    conversationController.getUserConversations

)


// Get conversation by ID
router.get(

    "/:conversationId",

    authMiddleware,

    conversationController.getConversationById

)


// Get conversation between PM and Employee
router.get(

    "/between/:projectManagerId/:employeeId/:projectId",

    authMiddleware,

    conversationController.getConversationBetween

)


// Delete conversation
router.delete(

    "/:conversationId",

    authMiddleware,

    (req, res) => conversationController.deleteConversation(req as any, res)

)


// ==========================================
// MESSAGE ROUTES
// ==========================================

// Create message in conversation
router.post(

    "/:conversationId/messages",

    authMiddleware,

    (req, res) => messageController.createMessage(req as any, res)

)


// Get all messages of conversation
router.get(

    "/:conversationId/messages",

    authMiddleware,

    messageController.getConversationMessages

)


// Mark message as read
router.patch(

    "/messages/:messageId/read",

    authMiddleware,

    messageController.markAsRead

)


// Mark all messages as read
router.patch(

    "/:conversationId/messages/mark-all-read",

    authMiddleware,

    messageController.markAllAsRead

)


// Get unread messages count
router.get(

    "/:conversationId/unread-count",

    authMiddleware,

    messageController.getUnreadCount

)


// Delete message
router.delete(

    "/messages/:messageId",

    authMiddleware,

    (req, res) => messageController.deleteMessage(req as any, res)

)


export default router
