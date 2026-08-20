import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import ProjectShot from "../database/models/projectShotModel";
import googleDriveService from "../services/googleDriveService";
import Project from "../database/models/projectModel";
import { IExtendedRequest, ShotStatus } from "../globals/types";

class ShotController {
  static async addShotToProject(req: IExtendedRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const { shotNumber, title, script, deadline } = req.body;

      // Validate projectId
      if (!projectId || typeof projectId !== "string") {
        return sendResponse(res, 400, "Invalid project ID!");
      }

      // Check project
      const project = await Project.findByPk(projectId);

      if (!project) {
        return sendResponse(res, 404, "Project not found!");
      }

      // Validate required fields
      if (!shotNumber || !title || !script || !deadline) {
        return sendResponse(res, 400, "Some fields are missing!");
      }

      // Check duplicate shot number
      const existingShot = await ProjectShot.findOne({
        where: {
          projectId: projectId,
          shotNumber,
        },
      });

      if (existingShot) {
        return sendResponse(
          res,
          401,
          "This shot number already exists in this project!",
        );
      }
      // Make sure project has a Google Drive folder
      if (!project.googleDriveFolderId) {
        return sendResponse(
          res,
          500,
          "Google Drive folder not found for this project!",
        );
      }

      /*
       * Create Google Drive folders
       */

      try {
        // Shot folder
        const shotFolder = await googleDriveService.createFolder(
          `Shot ${shotNumber}`,
          project.googleDriveFolderId,
        );

        if (!shotFolder.id) {
          throw new Error("Failed to create shot folder");
        }

        // Under Review
        const underReviewFolder = await googleDriveService.createFolder(
          "Under Review",
          shotFolder.id,
        );

        if (!underReviewFolder.id) {
          throw new Error("Failed to create Under Review folder");
        }

        // Final Video
        const finalVideoFolder = await googleDriveService.createFolder(
          "Final Video",
          shotFolder.id,
        );

        if (!finalVideoFolder.id) {
          throw new Error("Failed to create Final Video folder");
        }

        // Project Files
        const projectFilesFolder = await googleDriveService.createFolder(
          "Project Files",
          shotFolder.id,
        );

        if (!projectFilesFolder.id) {
          throw new Error("Failed to create Project Files folder");
        }

        /*
         * Create Shot in Database
         */

        const shot = await ProjectShot.create({
          projectId,
          shotNumber,
          title,
          script,
          deadline,
          status: ShotStatus.created,

          googleDriveFolderId: shotFolder.id,

          underReviewFolderId: underReviewFolder.id,

          finalVideoFolderId: finalVideoFolder.id,

          projectFilesFolderId: projectFilesFolder.id,

          createdBy: req.user?.id as string,
        });

        return sendResponse(res, 201, "Shot created successfully!", shot);
      } catch (driveError) {
        console.error("Failed to create Google Drive folders:", driveError);

        return sendResponse(res, 500, "Failed to create Google Drive folders!");
      }
    } catch (error) {
      console.error("Add Shot Error:", error);

      return sendResponse(res, 500, "Internal server error");
    }
  }

  // get all shots for the project
  static async getAllShotsOfProject(req: IExtendedRequest, res: Response) {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId as string);
    if (!projectId) {
      return sendResponse(res, 401, "No project Id found!");
    }
    if (!project) {
      return sendResponse(res, 401, "No project found!");
    }
    const shots = await ProjectShot.findAll({
      where: {
        projectId,
      },
      order: [["shotNumber", "ASC"]],
    });

    if (shots.length === 0) {
      return sendResponse(res, 401, "No shots found for the project!");
    }
    return sendResponse(res, 200, "Shots founds for the project!", shots);
  }

  // get shot details by id
  static async getShotById(req: Request, res: Response) {
    const { shotId } = req.params;
    const shot = await ProjectShot.findByPk(shotId as string);
    if (!shotId) {
      return sendResponse(res, 401, "No shotId found!");
    }
    if (!shot) {
      return sendResponse(res, 401, "No shot found!");
    }

    return sendResponse(res, 200, "Shot Info fetched!", shot);
  }

  // update shot data
  static async updateShotDetails(req: Request, res: Response) {
    const { shotId } = req.params;
    const shot = await ProjectShot.findByPk(shotId as string);
    if (!shotId) {
      return sendResponse(res, 401, "No shotId found!");
    }
    if (!shot) {
      return sendResponse(res, 401, "No shot found!");
    }
    const { shotNumber, title, script, deadline } = req.body;
    if (!shotNumber || !title || !script || !deadline) {
      return sendResponse(res, 401, "Some fields are missing");
    }
    await ProjectShot.update(
      {
        title,
        shotNumber,
        script,
        deadline,
      },
      { where: { id: shotId } },
    );

    return sendResponse(res, 200, "Shot updated successfully!");
  }

  // get shot details by id
  static async deleteShotById(req: Request, res: Response) {
    const { shotId } = req.params;
    const shot = await ProjectShot.findByPk(shotId as string);
    if (!shotId) {
      return sendResponse(res, 401, "No shotId found!");
    }
    if (!shot) {
      return sendResponse(res, 401, "No shot found!");
    }
    // Delete Google Drive folder
    if (shot.googleDriveFolderId) {
      await googleDriveService.deleteFile(shot.googleDriveFolderId as string);
    }
    // Delete DB record
    await shot.destroy();
    return sendResponse(res, 200, "Shot deleted!");
  }
}

export default ShotController