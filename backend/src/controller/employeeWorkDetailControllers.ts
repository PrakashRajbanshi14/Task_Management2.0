import { Response } from "express";

import {
  IExtendedRequest,
  SalaryStatus,
  UserRole,
} from "../globals/types";

import { sendResponse } from "../utils/sendResponse";

import EmployeeWorkDetail from "../database/models/employeeWorkDetailModel";

import User from "../database/models/userModel";

import { Op } from "sequelize";


class EmployeeWorkDetailControllers {

  // =====================================================
  // EMPLOYEE → GET MY WORK DETAILS
  // =====================================================

  static async getMyWorkDetails(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {

      const employeeId = req.user?.id;

      if (!employeeId) {
        return sendResponse(
          res,
          401,
          "Please login!",
        );
      }


      const { month, year } = req.query;


      const whereCondition: any = {
        employeeId,
      };


      // -----------------------------------------
      // Filter by month
      // -----------------------------------------

      if (month) {

        whereCondition.month = Number(month);

      }


      // -----------------------------------------
      // Filter by year
      // -----------------------------------------

      if (year) {

        whereCondition.year = Number(year);

      }


      const workDetails =
        await EmployeeWorkDetail.findAll({

          where: whereCondition,

          order: [
            ["year", "DESC"],
            ["month", "DESC"],
          ],

        });


      return sendResponse(
        res,
        200,
        "Your work details fetched successfully",
        workDetails,
      );

    } catch (error) {

      console.error(
        "Get My Work Details Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch work details",
      );

    }
  }


  // =====================================================
  // EMPLOYEE → GET WORK DETAILS OF PARTICULAR MONTH
  // =====================================================

  static async getMyMonthlyWorkDetails(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {

      const employeeId = req.user?.id;

      if (!employeeId) {
        return sendResponse(
          res,
          401,
          "Please login!",
        );
      }


      const { year, month } = req.params;


      if (!year || !month) {

        return sendResponse(
          res,
          400,
          "Year and month are required!",
        );

      }


      const workDetails =
        await EmployeeWorkDetail.findOne({

          where: {

            employeeId,

            year: Number(year),

            month: Number(month),

          },

        });


      if (!workDetails) {

        return sendResponse(
          res,
          404,
          "No work details found for this month!",
        );

      }


      return sendResponse(
        res,
        200,
        "Monthly work details fetched successfully",
        workDetails,
      );

    } catch (error) {

      console.error(
        "Get Monthly Work Details Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch monthly work details",
      );

    }
  }


  // =====================================================
  // ADMIN → GET ALL EMPLOYEE WORK DETAILS
  // =====================================================

  static async getAllEmployeeWorkDetails(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {

      const { year, month } = req.query;


      const whereCondition: any = {};


      if (year) {

        whereCondition.year = Number(year);

      }


      if (month) {

        whereCondition.month = Number(month);

      }


      const workDetails =
        await EmployeeWorkDetail.findAll({

          where: whereCondition,

          include: [
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
          ],

          order: [
            ["year", "DESC"],
            ["month", "DESC"],
          ],

        });


      return sendResponse(
        res,
        200,
        "Employee work details fetched successfully",
        workDetails,
      );

    } catch (error) {

      console.error(
        "Get All Employee Work Details Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch employee work details",
      );

    }
  }


  // =====================================================
  // ADMIN → GET PARTICULAR EMPLOYEE WORK DETAILS
  // =====================================================

  static async getEmployeeWorkDetails(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {

      const { employeeId } = req.params;


      if (!employeeId) {

        return sendResponse(
          res,
          400,
          "Employee ID is required!",
        );

      }


      const workDetails =
        await EmployeeWorkDetail.findAll({

          where: {
            employeeId,
          },

          include: [
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
          ],

          order: [
            ["year", "DESC"],
            ["month", "DESC"],
          ],

        });


      return sendResponse(
        res,
        200,
        "Employee work details fetched successfully",
        workDetails,
      );

    } catch (error) {

      console.error(
        "Get Employee Work Details Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch employee work details",
      );

    }
  }


  // =====================================================
  // ADMIN → GET EMPLOYEE MONTHLY WORK DETAILS
  // =====================================================

  static async getEmployeeMonthlyWorkDetails(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {

      const {
        employeeId,
        year,
        month,
      } = req.params;


      if (!employeeId) {

        return sendResponse(
          res,
          400,
          "Employee ID is required!",
        );

      }


      if (!year || !month) {

        return sendResponse(
          res,
          400,
          "Year and month are required!",
        );

      }


      const workDetails =
        await EmployeeWorkDetail.findOne({

          where: {

            employeeId,

            year: Number(year),

            month: Number(month),

          },

          include: [
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
          ],

        });


      if (!workDetails) {

        return sendResponse(
          res,
          404,
          "No work details found for this month!",
        );

      }


      return sendResponse(
        res,
        200,
        "Employee monthly work details fetched successfully",
        workDetails,
      );

    } catch (error) {

      console.error(
        "Get Employee Monthly Work Details Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch employee monthly work details",
      );

    }
  }


  // =====================================================
  // ADMIN → UPDATE SALARY STATUS
  // =====================================================

  static async updateSalaryStatus(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {

      const { workDetailId } = req.params;

      const { salaryStatus } = req.body;


      if (!workDetailId) {

        return sendResponse(
          res,
          400,
          "Work detail ID is required!",
        );

      }


      if (!salaryStatus) {

        return sendResponse(
          res,
          400,
          "Salary status is required!",
        );

      }


      // -----------------------------------------
      // Validate salary status
      // -----------------------------------------

      if (
        !Object.values(SalaryStatus).includes(
          salaryStatus,
        )
      ) {

        return sendResponse(
          res,
          400,
          "Invalid salary status!",
        );

      }


      const workDetails =
        await EmployeeWorkDetail.findByPk(
          workDetailId as string,
        );


      if (!workDetails) {

        return sendResponse(
          res,
          404,
          "Work details not found!",
        );

      }


      await workDetails.update({

        salaryStatus,

      });


      return sendResponse(
        res,
        200,
        "Salary status updated successfully",
        workDetails,
      );

    } catch (error) {

      console.error(
        "Update Salary Status Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to update salary status",
      );

    }
  }


  // =====================================================
  // ADMIN → GET UNPAID EMPLOYEE WORK
  // =====================================================

  static async getUnpaidWorkDetails(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {

      const { year, month } = req.query;


      const whereCondition: any = {

        salaryStatus:
          SalaryStatus.Unpaid,

      };


      if (year) {

        whereCondition.year =
          Number(year);

      }


      if (month) {

        whereCondition.month =
          Number(month);

      }


      const workDetails =
        await EmployeeWorkDetail.findAll({

          where: whereCondition,

          include: [
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
          ],

          order: [
            ["year", "DESC"],
            ["month", "DESC"],
          ],

        });


      return sendResponse(
        res,
        200,
        "Unpaid work details fetched successfully",
        workDetails,
      );

    } catch (error) {

      console.error(
        "Get Unpaid Work Details Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch unpaid work details",
      );

    }
  }

}


export default EmployeeWorkDetailControllers;