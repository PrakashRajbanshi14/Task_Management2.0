import Notification
  from "../database/models/notificationModel";

import {
  NotificationType,
} from "../globals/types";

import {
  getIO,
} from "../sockets/notificationSocket";


interface CreateNotificationData {

  senderId: string;

  receiverId: string;

  title: string;

  message: string;

  type: NotificationType;

  url?: string;
}


class NotificationService {

  // ==========================================
  // CREATE NOTIFICATION
  // ==========================================

  static async createNotification(
    data: CreateNotificationData
  ) {

    // ----------------------------------------
    // Save notification in database
    // ----------------------------------------

    const notification =
      await Notification.create({

        senderId:
          data.senderId,

        receiverId:
          data.receiverId,

        title:
          data.title,

        message:
          data.message,

        type:
          data.type,

        url:
          data.url ?? null,

        isRead:
          false,

      });


    // ----------------------------------------
    // Send real-time notification
    // ----------------------------------------

    try {

      const io = getIO();


      io.to(
        `user:${data.receiverId}`
      ).emit(
        "new_notification",
        notification
      );


    } catch (error) {

      console.error(
        "Socket notification error:",
        error
      );

      /*
        Don't fail the main operation
        if Socket.IO has an issue.
      */

    }


    return notification;
  }


  // ==========================================
  // SEND NOTIFICATION TO MULTIPLE USERS
  // ==========================================

  static async createNotifications(
    notifications: CreateNotificationData[]
  ) {

    const createdNotifications = [];


    for (
      const notificationData
      of notifications
    ) {

      const notification =
        await this.createNotification(
          notificationData
        );


      createdNotifications.push(
        notification
      );

    }


    return createdNotifications;
  }
}


export default NotificationService;