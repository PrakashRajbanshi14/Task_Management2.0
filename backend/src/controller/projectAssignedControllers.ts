import { Request, Response } from "express";
import { IExtendedRequest, UserRole } from "../globals/types";
import { sendResponse } from "../utils/sendResponse";
import ProjectAssigned from "../database/models/projectAssignedModel";
import Employee from "../database/models/employeeModel";
import Project from "../database/models/projectModel";
import User from "../database/models/userModel";

class projectAssignController {
  //assign project to the employees
  static async assignEmployeesToProject(req: IExtendedRequest, res: Response) {
    try {
      const projectId = req.params.projectId as string;

      const user = req.user?.id;

      const { employeeIds } = req.body;

      // --------------------------------
      // Check logged in user
      // --------------------------------

      if (!user) {
        return sendResponse(res, 401, "Please login");
      }

      // --------------------------------
      // Check project ID
      // --------------------------------

      if (!projectId) {
        return sendResponse(res, 400, "Project Id is required!");
      }

      // --------------------------------
      // Check employee IDs
      // --------------------------------

      if (
        !employeeIds ||
        !Array.isArray(employeeIds) ||
        employeeIds.length === 0
      ) {
        return sendResponse(res, 400, "At least one employee is required!");
      }

      // --------------------------------
      // Find project
      // --------------------------------

      const project = await Project.findByPk(projectId);

      if (!project) {
        return sendResponse(res, 404, "Project not found");
      }

      // --------------------------------
      // Check employees
      // --------------------------------

      const employees = await Employee.findAll({
        where: {
          id: employeeIds,
        },
      });

      if (employees.length !== employeeIds.length) {
        return sendResponse(res, 400, "One or more employee IDs are invalid");
      }

      // --------------------------------
      // Existing assignments
      // --------------------------------

      const existingAssignments = await ProjectAssigned.findAll({
        where: {
          projectId,
          employeeId: employeeIds,
        },
      });

      const existingEmployeeIds = existingAssignments.map(
        (assignment) => assignment.employeeId,
      );

      // --------------------------------
      // Remove already assigned
      // --------------------------------

      const newEmployeeIds = employeeIds.filter(
        (employeeId: string) => !existingEmployeeIds.includes(employeeId),
      );

      if (newEmployeeIds.length === 0) {
        return sendResponse(
          res,
          409,
          "All selected employees are already assigned to this project",
        );
      }

      // --------------------------------
      // Create assignments
      // --------------------------------

      const assignments = newEmployeeIds.map((employeeId: string) => ({
        projectId,

        employeeId,

        assignedBy: user,
      }));

      await ProjectAssigned.bulkCreate(assignments);

      return sendResponse(
        res,
        201,
        "Employees assigned to project successfully",
        {
          assignedEmployeeIds: newEmployeeIds,
        },
      );
    } catch (error) {
      console.error("Assign Employees Error:", error);

      return sendResponse(res, 500, "Internal server error");
    }
  }

  //get all assigned employees of Project
  static async getEmployeesOfProject(req: Request, res:Response){
    const {projectId} = req.params
    if(!projectId){
      return sendResponse(res, 401, "Please provide projectId")
    }
    const project = await Project.findByPk(projectId as string);
    if(!project){
      return sendResponse(res, 401, "NO project exists with that projectId")
    }

    const assignedEmployees = await ProjectAssigned.findAll({
        where: {
          projectId: projectId as string,
        },
        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "fullName",
              "contact",
              "address",
              "employeeCode",
              "JobTitle",
              "hasWork"
            ],
          },
        ],
        order: [["assignedAt", "DESC"]],
      });
    if(assignedEmployees.length === 0){
        return sendResponse(res, 401, "NO Employees assigned to that project")
     }
     return sendResponse(res, 200, "Employees that are assigned fetched of the projects", assignedEmployees)
  }


}

export default projectAssignController;
