import { Response } from "express";
import { IExtendedRequest, UserRole } from "../globals/types";
import { sendResponse } from "../utils/sendResponse";
import Project from "../database/models/projectModel";
import googleDriveService from "../services/googleDriveService";
import { envConfig } from "../config/config";

class ProjectController {
  //create project
  static async createProject(req: IExtendedRequest, res: Response) {
    try {
      const { name, description, startDate, endDate } = req.body;
      if (!name || !description || !startDate || !endDate) {
        return sendResponse(res, 401, "Some fields are missing!");
      }
      //check if project name exists
      const existingProject = await Project.findOne({
        where: {
          name,
        },
      });
      if (existingProject) {
        return sendResponse(res, 401, "Project with this name already exists!");
      }
      //get project managerID
      const projectManagerId = req.user?.id;
      if (!projectManagerId) {
        return sendResponse(res, 401, "Authentication required!");
      }

      // Create Project in Database
      const project = await Project.create({
        name,
        description,
        startDate,
        endDate,
        projectManagerId,
        googleDriveFolderId: null,
      });
      // Create Google Drive folder
      try {
        const projectFolder = await googleDriveService.createFolder(
          name,
          envConfig.googleDriveRootFolderId,
        );
        if (projectFolder.id) {
          await project.update({
            googleDriveFolderId: projectFolder.id,
          });
        }
      } catch (driveError) {
        console.error("Failed to create Google Drive folder:", driveError);
        // Optionally, you can delete the project
        await project.destroy();
        return sendResponse(res, 500, "Failed to create project folder!");
      }

      sendResponse(res, 200, "Project Created successfully!", project);
    } catch (error) {
      console.error("Create Project Error:", error);
       return sendResponse(res, 500, "Internal server error");
    }
  }

  // GET ALL PROJECTS
  static async getAllProjects(req: IExtendedRequest, res: Response) {
      const user = req.user
      if(!user){
        return sendResponse(res, 401, "user not logged in!")
      }
      const projects = await Project.findAll({
        order: [["createdAt", "DESC"]],
      });
      if(!projects){
        return sendResponse(res, 401, "No projects found!")
      }
      sendResponse(res, 200, "Projects fetched!", projects)
  }

  // GET PROJECT BY ID
  // ==========================================
  static async getProjectById(req: IExtendedRequest, res: Response) {
      const { projectId } = req.params;
      if(!projectId){
         return sendResponse(res, 401, "No projectId found!")
      }
      const project = await Project.findByPk(projectId as string);
      if(!project){
         return sendResponse(res, 401, "No project found!")
      }

      return sendResponse(res, 200, "project found!", project)
  }

  // UPDATE PROJECT
  static async updateProject(req: IExtendedRequest, res: Response) {
      const { projectId } = req.params;
      if (!projectId) {
        return sendResponse(res, 401, "NO projectId found")
      }
      const project = await Project.findByPk(projectId as string);
      if (!project) {
        return sendResponse(res, 401, "NO project found")
      }
      const { name, description, startDate, endDate } = req.body;
      // Check duplicate name
      if (name && name !== project.name) {
        const existingProject = await Project.findOne({
          where: {
            name,
          },
        });

        if (existingProject) {
          return res.status(409).json({
            message: "Another project already uses this name",
          });
        }
      }

      /*
     * Update Google Drive folder if project name changes
     */
    if (
      name &&
      name !== project.name &&
      project.googleDriveFolderId
    ) {
      try {
        await googleDriveService.updateFolder(
          project.googleDriveFolderId,
          name,
        );
      } catch (driveError) {
        return sendResponse(res,500,"Failed to update project folder in Google Drive");
      }
    }
      await project.update({
        name: name ?? project.name,
        description: description ?? project.description,
        startDate: startDate ?? project.startDate,
        endDate: endDate ?? project.endDate,
      }, {where: {id : projectId}});
      return res.status(200).json({
        message: "Project updated successfully",
        project,
      });
  }

  //delete project
  static async deleteProject(req: IExtendedRequest, res: Response) {
    try {
      const {projectId} = req.params;
      const project = await Project.findByPk(projectId as string);
      if (!projectId) {
        return sendResponse(res, 401, "No projectID Found!")
      }
      if (!project) {
        return sendResponse(res, 401, "No project Found!")
      }
      // Delete Google Drive folder
      if (project.googleDriveFolderId) {
        await googleDriveService.deleteFile(project.googleDriveFolderId);
      }
      // Delete database record
      await project.destroy();
      return sendResponse(res, 200, "project deleted!")
    } catch (error) {
      console.error("Delete Project Error:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

}


export default ProjectController
