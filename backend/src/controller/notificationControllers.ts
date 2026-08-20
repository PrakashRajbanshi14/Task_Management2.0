import { Response } from "express";

import {
  IExtendedRequest,
} from "../globals/types";

import Notification
  from "../database/models/notificationModel";

import User
  from "../database/models/userModel";

import { sendResponse }
  from "../utils/sendResponse";


class NotificationController {

  // ==========================================
  // GET MY NOTIFICATIONS
  // ==========================================

  static async getMyNotifications(
    req: IExtendedRequest,
    res: Response
  ) {

    try {

      const receiverId =
        req.user?.id;


      if (!receiverId) {

        return sendResponse(
          res,
          401,
          "Please login!"
        );

      }


      const notifications =
        await Notification.findAll({

          where: {
            receiverId,
          },

          include: [

            {
              model: User,

              as: "sender",

              attributes: [
                "id",
                "userName",
                "email",
                "profileImage",
              ],
            },

          ],

          order: [
            ["createdAt", "DESC"],
          ],

        });


      return sendResponse(

        res,

        200,

        "Notifications fetched successfully",

        notifications

      );


    } catch (error) {

      console.error(
        "Get Notifications Error:",
        error
      );


      return sendResponse(
        res,
        500,
        "Failed to fetch notifications"
      );

    }

  }


  // ==========================================
  // GET UNREAD NOTIFICATIONS
  // ==========================================

  static async getUnreadNotifications(
    req: IExtendedRequest,
    res: Response
  ) {

    try {

      const receiverId =
        req.user?.id;


      if (!receiverId) {

        return sendResponse(
          res,
          401,
          "Please login!"
        );

      }


      const notifications =
        await Notification.findAll({

          where: {

            receiverId,

            isRead: false,

          },

          include: [

            {
              model: User,

              as: "sender",

              attributes: [
                "id",
                "userName",
                "email",
                "profileImage",
              ],
            },

          ],

          order: [
            ["createdAt", "DESC"],
          ],

        });


      return sendResponse(

        res,

        200,

        "Unread notifications fetched successfully",

        notifications

      );


    } catch (error) {

      console.error(
        "Get Unread Notifications Error:",
        error
      );


      return sendResponse(
        res,
        500,
        "Failed to fetch unread notifications"
      );

    }

  }


  // ==========================================
  // GET SINGLE NOTIFICATION
  // ==========================================

  static async getNotificationById(
    req: IExtendedRequest,
    res: Response
  ) {

    try {

      const receiverId =
        req.user?.id;


      const { notificationId } =
        req.params;


      if (!receiverId) {

        return sendResponse(
          res,
          401,
          "Please login!"
        );

      }


      if (!notificationId) {

        return sendResponse(
          res,
          400,
          "Notification ID is required!"
        );

      }


      const notification =
        await Notification.findOne({

          where: {

            id:
              notificationId,

            receiverId,

          },

          include: [

            {
              model: User,

              as: "sender",

              attributes: [
                "id",
                "userName",
                "email",
                "profileImage",
              ],
            },

          ],

        });


      if (!notification) {

        return sendResponse(
          res,
          404,
          "Notification not found!"
        );

      }


      return sendResponse(

        res,

        200,

        "Notification fetched successfully",

        notification

      );


    } catch (error) {

      console.error(
        "Get Notification Error:",
        error
      );


      return sendResponse(
        res,
        500,
        "Failed to fetch notification"
      );

    }

  }


  // ==========================================
  // MARK NOTIFICATION AS READ
  // ==========================================

  static async markAsRead(
    req: IExtendedRequest,
    res: Response
  ) {

    try {

      const receiverId =
        req.user?.id;


      const { notificationId } =
        req.params;


      if (!receiverId) {

        return sendResponse(
          res,
          401,
          "Please login!"
        );

      }


      const notification =
        await Notification.findOne({

          where: {

            id:
              notificationId,

            receiverId,

          },

        });


      if (!notification) {

        return sendResponse(
          res,
          404,
          "Notification not found!"
        );

      }


      notification.isRead =
        true;


      await notification.save();


      return sendResponse(

        res,

        200,

        "Notification marked as read",

        notification

      );


    } catch (error) {

      console.error(
        "Mark Notification Read Error:",
        error
      );


      return sendResponse(
        res,
        500,
        "Failed to mark notification as read"
      );

    }

  }


  // ==========================================
  // MARK ALL AS READ
  // ==========================================

  static async markAllAsRead(
    req: IExtendedRequest,
    res: Response
  ) {

    try {

      const receiverId =
        req.user?.id;


      if (!receiverId) {

        return sendResponse(
          res,
          401,
          "Please login!"
        );

      }


      await Notification.update(

        {
          isRead: true,
        },

        {
          where: {

            receiverId,

            isRead: false,

          },

        }

      );


      return sendResponse(

        res,

        200,

        "All notifications marked as read"

      );


    } catch (error) {

      console.error(
        "Mark All Notifications Read Error:",
        error
      );


      return sendResponse(
        res,
        500,
        "Failed to mark notifications as read"
      );

    }

  }


  // ==========================================
  // DELETE NOTIFICATION
  // ==========================================

  static async deleteNotification(
    req: IExtendedRequest,
    res: Response
  ) {

    try {

      const receiverId =
        req.user?.id;


      const { notificationId } =
        req.params;


      if (!receiverId) {

        return sendResponse(
          res,
          401,
          "Please login!"
        );

      }


      const notification =
        await Notification.findOne({

          where: {

            id:
              notificationId,

            receiverId,

          },

        });


      if (!notification) {

        return sendResponse(
          res,
          404,
          "Notification not found!"
        );

      }


      await notification.destroy();


      return sendResponse(

        res,

        200,

        "Notification deleted successfully"

      );


    } catch (error) {

      console.error(
        "Delete Notification Error:",
        error
      );


      return sendResponse(
        res,
        500,
        "Failed to delete notification"
      );

    }

  }

}


export default NotificationController;