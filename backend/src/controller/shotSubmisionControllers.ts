import { Response } from "express";
import fs from "fs";

import {
  IExtendedRequest,
  SubmissionStatus,
  SubmissionFileType,
  ShotStatus,
} from "../globals/types";

import { sendResponse } from "../utils/sendResponse";

import ProjectShot
  from "../database/models/projectShotModel";

import ShotAssigned
  from "../database/models/shotAssignedModel";

import ShotSubmission
  from "../database/models/shotSubmissionModel";

import Project
  from "../database/models/projectModel";

import googleDriveService
  from "../services/googleDriveService";


class ShotSubmissionControllers {

  static async submitShot(
    req: IExtendedRequest,
    res: Response
  ) {

    try {

      const submittedBy =
        req.user?.id;


      if (!submittedBy) {
        return sendResponse(
          res,
          401,
          "Please login!"
        );
      }


      const shotId =
        req.params.shotId as string;


      if (!shotId) {
        return sendResponse(
          res,
          400,
          "Shot ID is required!"
        );
      }


      const files =
        req.files as {
          [fieldname: string]:
            Express.Multer.File[];
        };


      const video =
        files?.video?.[0];


      const projectFiles =
        files?.projectFiles || [];


      if (
        !video &&
        projectFiles.length === 0
      ) {

        return sendResponse(
          res,
          400,
          "Please upload a video or project file!"
        );

      }


      const shot =
        await ProjectShot.findByPk(
          shotId
        );


      if (!shot) {
        return sendResponse(
          res,
          404,
          "Shot not found!"
        );
      }


      const assignment =
        await ShotAssigned.findOne({

          where: {
            shotId,
            employeeId: submittedBy,
          },

        });


      if (!assignment) {
        return sendResponse(
          res,
          403,
          "This shot is not assigned to you!"
        );
      }


      const project =
        await Project.findByPk(
          shot.projectId
        );


      if (!project) {
        return sendResponse(
          res,
          404,
          "Project not found!"
        );
      }


      // Get previous version

      const previousSubmission =
        await ShotSubmission.findOne({

          where: {
            shotId,
          },

          order: [
            ["version", "DESC"],
          ],

        });


      const version =
        previousSubmission
          ? previousSubmission.version + 1
          : 1;


      // Get folders

      const folders =
        await googleDriveService
          .getShotUnderReviewFolder(
            project.name,
            shot.shotNumber,
            version
          );


      const versionFolderId =
        folders.versionFolderId;


      const filesToUpload: {
        file: Express.Multer.File;
        fileType: SubmissionFileType;
      }[] = [];


      if (video) {

        filesToUpload.push({

          file: video,

          fileType:
            SubmissionFileType.video,

        });

      }


      for (
        const projectFile
        of projectFiles
      ) {

        filesToUpload.push({

          file: projectFile,

          fileType:
            SubmissionFileType.projectFiles,

        });

      }


      const submissions = [];


      for (
        const item
        of filesToUpload
      ) {

        const file =
          item.file;


        // Temporary version prefix

        const driveFileName =
          `v${version}_${file.originalname}`;


        const uploadedFile =
          await googleDriveService
            .uploadFileToDrive(

              file.path,

              driveFileName,

              file.mimetype,

              versionFolderId

            );


        if (!uploadedFile.id) {
          throw new Error(
            "Google Drive upload failed"
          );
        }


        const submission =
          await ShotSubmission.create({

            shotId,

            submittedBy,

            version,

            driveFileId:
              uploadedFile.id,

            driveFileUrl:
              uploadedFile.webViewLink
                ?? null,

            // Store original name
            // without version prefix

            fileName:
              file.originalname,

            fileSize:
              file.size,

            mimeType:
              file.mimetype,

            fileType:
              item.fileType,

            status:
              SubmissionStatus.submitted,

          });


        submissions.push(
          submission
        );


        if (
          fs.existsSync(file.path)
        ) {

          fs.unlinkSync(file.path);

        }

      }


      await ProjectShot.update(

        {
          status:
            ShotStatus.submitted,
        },

        {
          where: {
            id: shotId,
          },
        }

      );


      return sendResponse(

        res,

        201,

        "Shot submitted successfully",

        {
          version,
          submissions,
        }

      );


    } catch (error) {

      console.error(
        "Shot Submission Error:",
        error
      );


      return sendResponse(
        res,
        500,
        "Failed to submit shot"
      );

    }

  }


  // ==========================================
  // GET ALL SUBMISSIONS OF SHOT
  // ==========================================

  static async getAllSubmissionsOfShot(
    req: IExtendedRequest,
    res: Response
  ) {

    try {

      const { shotId } =
        req.params;


      if (!shotId) {
        return sendResponse(
          res,
          400,
          "Shot ID is required!"
        );
      }


      const submissions =
        await ShotSubmission.findAll({

          where: {
            shotId,
          },

          order: [
            ["version", "DESC"],
            ["createdAt", "DESC"],
          ],

        });


      return sendResponse(
        res,
        200,
        "Submissions fetched successfully",
        submissions
      );


    } catch (error) {

      console.error(error);

      return sendResponse(
        res,
        500,
        "Failed to fetch submissions"
      );

    }

  }


  // ==========================================
  // GET SUBMISSION BY ID
  // ==========================================

  static async getSubmissionById(
    req: IExtendedRequest,
    res: Response
  ) {

    try {

      const { submissionId } =
        req.params;


      const submission =
        await ShotSubmission.findByPk(
          submissionId as string
        );


      if (!submission) {
        return sendResponse(
          res,
          404,
          "Submission not found!"
        );
      }


      return sendResponse(
        res,
        200,
        "Submission fetched successfully",
        submission
      );


    } catch (error) {

      console.error(error);

      return sendResponse(
        res,
        500,
        "Failed to fetch submission"
      );

    }

  }


  // ==========================================
  // DELETE SUBMISSION
  // ==========================================

  static async deleteSubmissionById(
    req: IExtendedRequest,
    res: Response
  ) {

    try {

      const { submissionId } =
        req.params;


      const submission =
        await ShotSubmission.findByPk(
          submissionId as string
        );


      if (!submission) {
        return sendResponse(
          res,
          404,
          "Submission not found!"
        );
      }


      if (
        submission.status ===
        SubmissionStatus.approved
      ) {

        return sendResponse(
          res,
          400,
          "Approved submission cannot be deleted!"
        );

      }


      await googleDriveService
        .deleteFile(
          submission.driveFileId
        );


      await submission.destroy();


      return sendResponse(
        res,
        200,
        "Submission deleted successfully"
      );


    } catch (error) {

      console.error(
        "Delete Submission Error:",
        error
      );


      return sendResponse(
        res,
        500,
        "Failed to delete submission"
      );

    }

  }

}


export default ShotSubmissionControllers;