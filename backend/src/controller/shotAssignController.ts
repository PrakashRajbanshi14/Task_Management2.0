import { Response } from "express";
import {
  IExtendedRequest,
  NotificationType,
  ShotStatus,
} from "../globals/types";
import { sendResponse } from "../utils/sendResponse";
import ProjectShot from "../database/models/projectShotModel";
import ShotAssigned from "../database/models/shotAssignedModel";
import NotificationService from "../services/notificationService";

class ShotAssignController {
  //Assign shot to employee
  static async assignShotToEmployee(req: IExtendedRequest, res: Response) {
    const { employeeId, shotId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, 401, "please logged in!");
    }
    if (!employeeId) {
      return sendResponse(res, 401, "please provide employeeId!");
    }
    if (!shotId) {
      return sendResponse(res, 401, "please provide shotId!");
    }
    //check shot exists
    const shot = await ProjectShot.findByPk(shotId as string);
    if (!shot) {
      return sendResponse(res, 401, "NO shot exists!");
    }
    //check if already assigned
    const alreadyAssigned = await ShotAssigned.findOne({
      where: {
        shotId,
        employeeId,
      },
    });
    if (alreadyAssigned) {
      return sendResponse(res, 401, "shot already assigned!");
    }

    //assign shot to employee
    const assign = await ShotAssigned.create({
      shotId: shotId as string,
      employeeId: employeeId as string,
      assignedBy: userId,
    });

    //create notification
    await NotificationService.createNotification({
      senderId: userId,
      receiverId: employeeId as string,
      title: "New Shot Assigned",
      message: `You have been assigned shot ${shot.shotNumber}.`,
      type: NotificationType.shotAssigned,
      url: `/employee/shots/${shotId}`,
    });

    //update shot status to assigned
    await ProjectShot.update(
      { status: ShotStatus.assigned },
      { where: { id: shotId } },
    );
    return sendResponse(res, 200, "Shot assigned to employee!");
  }

  // remove shot assignment from employee
  static async removeShotAssignFromEmployee(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {
      const { employeeId, shotId } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return sendResponse(res, 401, "Please login!");
      }
      if (!employeeId) {
        return sendResponse(res, 400, "Please provide employeeId!");
      }
      if (!shotId) {
        return sendResponse(res, 400, "Please provide shotId!");
      }
      // Check shot exists
      const shot = await ProjectShot.findByPk(shotId as string);
      if (!shot) {
        return sendResponse(res, 404, "No shot exists!");
      }

      // Check assignment exists
      const alreadyAssigned = await ShotAssigned.findOne({
        where: {
          shotId,
          employeeId,
        },
      });

      if (!alreadyAssigned) {
        return sendResponse(
          res,
          404,
          "This shot is not assigned to this employee!",
        );
      }

      // Remove assignment
      await alreadyAssigned.destroy();
      await ProjectShot.update(
        {
          status: ShotStatus.created,
        },

        {
          where: {
            id: shotId,
          },
        },
      );

      return sendResponse(res, 200, "Shot removed from employee successfully!");
    } catch (error) {
      console.error("Remove Shot Assignment Error:", error);

      return sendResponse(res, 500, "Internal server error");
    }
  }

  // get all shots assigned to  employee
  static async getAllAssignedShots(req: IExtendedRequest, res: Response) {
    const employeeId = req.user?.id;

    if (!employeeId) {
      return sendResponse(res, 401, "Please login!");
    }
    // --------------------------------
    // Get assigned shots
    // --------------------------------

    const assignedShots = await ShotAssigned.findAll({
      where: {
        employeeId,
      },

      include: [
        {
          model: ProjectShot,
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    // --------------------------------
    // No shots found
    // --------------------------------

    if (assignedShots.length === 0) {
      return sendResponse(res, 200, "No shots assigned to you", []);
    }

    // --------------------------------
    // Return assigned shots
    // --------------------------------

    return sendResponse(
      res,
      200,
      "Assigned shots retrieved successfully",
      assignedShots,
    );
  }
}

export default ShotAssignController;
