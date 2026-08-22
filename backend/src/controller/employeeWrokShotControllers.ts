import { Response } from "express";

import {
  IExtendedRequest,
  UserRole,
} from "../globals/types";

import { sendResponse } from "../utils/sendResponse";

import EmployeeWorkShot from "../database/models/employeeWorkShotModel";

import EmployeeWorkDetail from "../database/models/employeeWorkDetailModel";

import Project from "../database/models/projectModel";

import ProjectShot from "../database/models/projectShotModel";


class EmployeeWorkShotControllers {

  // ==========================================
  // GET MY WORK SHOTS
  // ==========================================

  static async getMyWorkShots(
    req: IExtendedRequest,
    res: Response,
  ) {

    try {

      const employeeId =
        req.user?.id;

      if (!employeeId) {

        return sendResponse(
          res,
          401,
          "Please login!",
        );

      }

      const {
        workDetailId,
      } = req.params;

      if (!workDetailId) {

        return sendResponse(
          res,
          400,
          "Work detail ID is required!",
        );

      }

      // ----------------------------------------
      // Verify work detail belongs to employee
      // ----------------------------------------

      const workDetail =
        await EmployeeWorkDetail.findOne({
          where: {
            id: workDetailId,
            employeeId,
          },
        });

      if (!workDetail) {

        return sendResponse(
          res,
          404,
          "Work detail not found!",
        );

      }

      // ----------------------------------------
      // Get work shots
      // ----------------------------------------

      const workShots =
        await EmployeeWorkShot.findAll({

          where: {
            workDetailId,
          },

          include: [
            {
              model: Project,
              as: "project",
            },

            {
              model: ProjectShot,
              as: "shot",
            },
          ],

          order: [
            ["createdAt", "DESC"],
          ],

        });

      return sendResponse(
        res,
        200,
        "Work shots fetched successfully",
        workShots,
      );

    } catch (error) {

      console.error(
        "Get My Work Shots Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch work shots",
      );

    }

  }


  // ==========================================
  // GET WORK SHOTS BY WORK DETAIL
  // ==========================================

  static async getWorkShotsByWorkDetail(
    req: IExtendedRequest,
    res: Response,
  ) {

    try {

      const {
        workDetailId,
      } = req.params;

      if (!workDetailId) {

        return sendResponse(
          res,
          400,
          "Work detail ID is required!",
        );

      }

      const workDetail =
        await EmployeeWorkDetail.findByPk(
          workDetailId as string,
        );

      if (!workDetail) {

        return sendResponse(
          res,
          404,
          "Work detail not found!",
        );

      }

      const workShots =
        await EmployeeWorkShot.findAll({

          where: {
            workDetailId,
          },

          include: [
            {
              model: Project,
              as: "project",
            },

            {
              model: ProjectShot,
              as: "shot",
            },
          ],

          order: [
            ["createdAt", "DESC"],
          ],

        });

      return sendResponse(
        res,
        200,
        "Work shots fetched successfully",
        workShots,
      );

    } catch (error) {

      console.error(
        "Get Work Shots Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch work shots",
      );

    }

  }


  // ==========================================
  // GET WORK SHOT BY ID
  // ==========================================

  static async getWorkShotById(
    req: IExtendedRequest,
    res: Response,
  ) {

    try {

      const {
        id,
      } = req.params;

      if (!id) {

        return sendResponse(
          res,
          400,
          "Work shot ID is required!",
        );

      }

      const workShot =
        await EmployeeWorkShot.findByPk(
          id as string,
          {
            include: [
              {
                model: Project,
                as: "project",
              },

              {
                model: ProjectShot,
                as: "shot",
              },
            ],
          },
        );

      if (!workShot) {

        return sendResponse(
          res,
          404,
          "Work shot not found!",
        );

      }

      return sendResponse(
        res,
        200,
        "Work shot fetched successfully",
        workShot,
      );

    } catch (error) {

      console.error(
        "Get Work Shot Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch work shot",
      );

    }

  }


  // ==========================================
  // DELETE WORK SHOT
  // ==========================================

  static async deleteWorkShot(
    req: IExtendedRequest,
    res: Response,
  ) {

    try {

      const {
        id,
      } = req.params;

      if (!id) {

        return sendResponse(
          res,
          400,
          "Work shot ID is required!",
        );

      }

      const workShot =
        await EmployeeWorkShot.findByPk(
          id as string,
        );

      if (!workShot) {

        return sendResponse(
          res,
          404,
          "Work shot not found!",
        );

      }

      await workShot.destroy();

      return sendResponse(
        res,
        200,
        "Work shot deleted successfully",
      );

    } catch (error) {

      console.error(
        "Delete Work Shot Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to delete work shot",
      );

    }

  }

}


export default EmployeeWorkShotControllers;