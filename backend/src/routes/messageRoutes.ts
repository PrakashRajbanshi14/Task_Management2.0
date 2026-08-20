import express from "express";

import {
  isUserLoggedIn,
  accessToRoles,
} from "../middlewares/UserMiddleware";

import {
  UserRole,
} from "../globals/types";
import MessageController from "../controller/messageControllers";

const router =
  express.Router();


const chatRoles = [
  UserRole.Employee,
  UserRole.ProjectManager,
  UserRole.Admin,
];


// ==========================================
// Get messages
// ==========================================

router.get(
  "/:conversationId",

  isUserLoggedIn,

  accessToRoles(...chatRoles),

  MessageController.getMessages,
);


// ==========================================
// Mark messages as read
// ==========================================

router.patch(
  "/:conversationId/read",

  isUserLoggedIn,

  accessToRoles(...chatRoles),

  MessageController.markMessagesAsRead,
);


export default router;