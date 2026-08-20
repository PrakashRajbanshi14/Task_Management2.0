import { Request, Response } from "express";

import Shot from "../database/models/projectShotModel";
import User from "../database/models/userModel";
import ShotAssigned from "../database/models/shotAssignedModel";
import { IExtendedRequest } from "../globals/types";
import { AutomatedMessageService } from "../services/automatedMessageService";

class ShotAssignedController {
  // ==========================================
  // ASSIGN EMPLOYEE TO SHOT
  // ==========================================

  async assignEmployeeToShot(req: IExtendedRequest, res: Response) {
    try {
      const { shotId } = req.params;

      const { employeeId } = req.body;

      // --------------------------------------
      // Validation
      // --------------------------------------

      if (!employeeId) {
        return res.status(400).json({
          message: "Employee ID is required",
        });
      }

      // --------------------------------------
      // Check if shot exists
      // --------------------------------------

      const shot = await Shot.findByPk(shotId as string);

      if (!shot) {
        return res.status(404).json({
          message: "Shot not found",
        });
      }

      // --------------------------------------
      // Check if employee exists
      // --------------------------------------

      const employee = await User.findByPk(employeeId);

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      // --------------------------------------
      // Check if already assigned
      // --------------------------------------

      const existingAssignment = await ShotAssigned.findOne({
        where: {
          shotId,

          employeeId,
        },
      });

      if (existingAssignment) {
        return res.status(409).json({
          message: "Employee is already assigned to this shot",
        });
      }

      // --------------------------------------
      // Assign Employee to Shot
      // --------------------------------------

      const assignedBy = req.user?.id;
      if (!assignedBy) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const assignment = await ShotAssigned.create({
        shotId: shotId as string,

        employeeId,

        assignedBy,

        assignedAt: new Date(),
      });

      // Send automatic notification message
      await AutomatedMessageService.sendShotAssignmentMessage(
        assignedBy,

        employeeId,

        shot.projectId,

        shot.shotNumber,

        shot.title,

        shot.deadline
      );

      return res.status(201).json({
        message: "Employee assigned to shot successfully",

        assignment,
      });
    } catch (error) {
      console.error("Assign Employee to Shot Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET ASSIGNMENT OF SHOT
  // ==========================================

  async getShotAssignment(req: Request, res: Response) {
    try {
      const { shotId } = req.params;

      // --------------------------------------
      // Check if shot exists
      // --------------------------------------

      const shot = await Shot.findByPk(shotId as string);

      if (!shot) {
        return res.status(404).json({
          message: "Shot not found",
        });
      }

      // --------------------------------------
      // Get assignment
      // --------------------------------------

      const assignment = await ShotAssigned.findOne({
        where: {
          shotId: shotId as string,
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

              "phone",

              "profileImage",
            ],
          },

          {
            model: User,

            as: "assignedByUser",

            attributes: ["id", "userName", "fullName"],
          },
        ],
      });

      if (!assignment) {
        return res.status(404).json({
          message: "No employee assigned to this shot",
        });
      }

      return res.status(200).json({
        assignment,
      });
    } catch (error) {
      console.error("Get Shot Assignment Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET ALL SHOTS ASSIGNED TO EMPLOYEE
  // ==========================================

  async getEmployeeShotAssignments(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      // --------------------------------------
      // Check if employee exists
      // --------------------------------------

      const employee = await User.findByPk(employeeId as string);

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      // --------------------------------------
      // Get all assigned shots
      // --------------------------------------

      const assignments = await ShotAssigned.findAll({
        where: {
          employeeId: employeeId as string,
        },

        include: [
          {
            model: Shot,

            as: "shot",

            attributes: [
              "id",

              "shotNumber",

              "title",

              "description",

              "status",

              "priority",
            ],
          },

          {
            model: User,

            as: "assignedByUser",

            attributes: ["id", "userName", "fullName"],
          },
        ],

        order: [["assignedAt", "DESC"]],
      });

      return res.status(200).json({
        assignments,
      });
    } catch (error) {
      console.error("Get Employee Shot Assignments Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // REMOVE EMPLOYEE FROM SHOT
  // ==========================================

  async removeEmployeeFromShot(req: Request, res: Response) {
    try {
      const { shotId, assignmentId } = req.params;

      // --------------------------------------
      // Check if assignment exists
      // --------------------------------------

      const assignment = await ShotAssigned.findByPk(assignmentId as string);

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      // Verify that the assignment belongs to the shot
      if (assignment.shotId !== (shotId as string)) {
        return res.status(400).json({
          message: "Assignment does not belong to this shot",
        });
      }

      // --------------------------------------
      // Delete assignment
      // --------------------------------------

      await assignment.destroy();

      return res.status(200).json({
        message: "Employee removed from shot successfully",
      });
    } catch (error) {
      console.error("Remove Employee from Shot Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new ShotAssignedController();
