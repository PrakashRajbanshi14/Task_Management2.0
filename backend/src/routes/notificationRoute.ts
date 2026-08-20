import express from "express";

import {
  isUserLoggedIn,
} from "../middlewares/UserMiddleware";

import NotificationController
  from "../controller/notificationControllers";


const router =
  express.Router();


// ==========================================
// Get all notifications
// ==========================================

router.get(
  "/",
  isUserLoggedIn,
  NotificationController
    .getMyNotifications
);


// ==========================================
// Get unread notifications
// ==========================================

router.get(
  "/unread",
  isUserLoggedIn,
  NotificationController
    .getUnreadNotifications
);


// ==========================================
// Get notification by ID
// ==========================================

router.get(
  "/:notificationId",
  isUserLoggedIn,
  NotificationController
    .getNotificationById
);


// ==========================================
// Mark as read
// ==========================================

router.patch(
  "/:notificationId/read",
  isUserLoggedIn,
  NotificationController
    .markAsRead
);


// ==========================================
// Mark all as read
// ==========================================

router.patch(
  "/read-all",
  isUserLoggedIn,
  NotificationController
    .markAllAsRead
);


// ==========================================
// Delete notification
// ==========================================

router.delete(
  "/:notificationId",
  isUserLoggedIn,
  NotificationController
    .deleteNotification
);


export default router;