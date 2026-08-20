import { Request, Response } from "express";

import Project from "../database/models/projectModel";
import User from "../database/models/userModel";
import ProjectAssigned from "../database/models/projectAssignedModel";
import { IExtendedRequest } from "../globals/types";
import { AutomatedMessageService } from "../services/automatedMessageService";

class ProjectAssignedController {
  // ==========================================
  // ASSIGN EMPLOYEE TO PROJECT
  // ==========================================

  async assignEmployeeToProject(req: IExtendedRequest, res: Response) {
    try {
      const { projectId } = req.params;

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
      // Check if project exists
      // --------------------------------------

      const project = await Project.findByPk(projectId as string);

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
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

      const existingAssignment = await ProjectAssigned.findOne({
        where: {
          projectId,

          employeeId,
        },
      });

      if (existingAssignment) {
        return res.status(409).json({
          message: "Employee is already assigned to this project",
        });
      }

      // --------------------------------------
      // Assign Employee to Project
      // --------------------------------------
      const assignedBy = req.user?.id;
      if (!assignedBy) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const assignment = await ProjectAssigned.create({
        projectId: projectId as string,
        employeeId,
        assignedBy,
      });

      // Send automatic notification message
      await AutomatedMessageService.sendProjectAssignmentMessage(
        assignedBy,

        employeeId,

        projectId as string,

        project.name,

        project.endDate
      );

      return res.status(201).json({
        message: "Employee assigned to project successfully",

        assignment,
      });
    } catch (error) {
      console.error("Assign Employee to Project Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET ALL EMPLOYEES OF PROJECT
  // ==========================================

  async getProjectEmployees(req: Request, res: Response) {
    try {
      const { projectId } = req.params;

      // --------------------------------------
      // Check if project exists
      // --------------------------------------

      const project = await Project.findByPk(projectId as string);

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      // --------------------------------------
      // Get all assigned employees
      // --------------------------------------

      const assignments = await ProjectAssigned.findAll({
        where: {
          projectId: projectId as string,
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

        order: [["assignedAt", "DESC"]],
      });

      return res.status(200).json({
        assignments,
      });
    } catch (error) {
      console.error("Get Project Employees Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET ALL PROJECTS OF EMPLOYEE
  // ==========================================

  async getEmployeeProjects(req: Request, res: Response) {
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
      // Get all assigned projects
      // --------------------------------------

      const assignments = await ProjectAssigned.findAll({
        where: {
          employeeId: employeeId as string,
        },

        include: [
          {
            model: Project,

            as: "project",

            attributes: [
              "id",

              "name",

              "description",

              "startDate",

              "endDate",

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
      console.error("Get Employee Projects Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // REMOVE EMPLOYEE FROM PROJECT
  // ==========================================

  async removeEmployeeFromProject(req: Request, res: Response) {
    try {
      const { projectId, assignmentId } = req.params;

      // --------------------------------------
      // Check if assignment exists
      // --------------------------------------

      const assignment = await ProjectAssigned.findByPk(assignmentId as string);

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      // Verify that the assignment belongs to the project
      if (assignment.projectId !== (projectId as string)) {
        return res.status(400).json({
          message: "Assignment does not belong to this project",
        });
      }

      // --------------------------------------
      // Delete assignment
      // --------------------------------------

      await assignment.destroy();

      return res.status(200).json({
        message: "Employee removed from project successfully",
      });
    } catch (error) {
      console.error("Remove Employee from Project Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new ProjectAssignedController();
