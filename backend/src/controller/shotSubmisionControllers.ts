import { Response } from "express";
import fs from "fs";

import {
  IExtendedRequest,
  SubmissionStatus,
  SubmissionFileType,
  ShotStatus,
  NotificationType,
} from "../globals/types";

import { sendResponse } from "../utils/sendResponse";

import ProjectShot from "../database/models/projectShotModel";
import ShotAssigned from "../database/models/shotAssignedModel";
import ShotSubmission from "../database/models/shotSubmissionModel";
import SubmissionFile from "../database/models/submissionFileModel";
import Project from "../database/models/projectModel";

import googleDriveService from "../services/googleDriveService";
import NotificationService from "../services/notificationService";

class ShotSubmissionControllers {
  // =====================================================
  // SUBMIT SHOT
  // =====================================================

  static async submitShot(req: IExtendedRequest, res: Response) {
    try {
      // ===================================================
      // Authentication
      // ===================================================

      const submittedBy = req.user?.id;

      if (!submittedBy) {
        return sendResponse(res, 401, "Please login!");
      }

      // ===================================================
      // Shot ID
      // ===================================================

      const { shotId } = req.params;

      if (!shotId) {
        return sendResponse(res, 400, "Shot ID is required!");
      }

      // ===================================================
      // Uploaded files
      // ===================================================

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const video = files?.video?.[0];

      const projectFiles = files?.projectFiles || [];

      // At least one file is required
      if (!video && projectFiles.length === 0) {
        return sendResponse(
          res,
          400,
          "Please upload a video or project file!",
        );
      }

      // ===================================================
      // Video length
      // ===================================================

      let videoLength = 0;

      if (video) {
        if (
          req.body.videoLength === undefined ||
          req.body.videoLength === null ||
          req.body.videoLength === ""
        ) {
          return sendResponse(
            res,
            400,
            "Video length is required when submitting a video!",
          );
        }

        videoLength = Number(req.body.videoLength);

        if (isNaN(videoLength) || videoLength <= 0) {
          return sendResponse(
            res,
            400,
            "Video length must be a valid positive number!",
          );
        }
      }

      // ===================================================
      // Find shot
      // ===================================================

      const shot = await ProjectShot.findByPk(shotId as string);

      if (!shot) {
        return sendResponse(
          res,
          404,
          "Shot not found!",
        );
      }

      // ===================================================
      // Check employee assignment
      // ===================================================

      const assignment = await ShotAssigned.findOne({
        where: {
          shotId,
          employeeId: submittedBy,
        },
      });

      if (!assignment) {
        return sendResponse(
          res,
          403,
          "This shot is not assigned to you!",
        );
      }

      // ===================================================
      // Find project
      // ===================================================

      const project = await Project.findByPk(
        shot.projectId,
      );

      if (!project) {
        return sendResponse(
          res,
          404,
          "Project not found!",
        );
      }

      // ===================================================
      // Determine next version
      // ===================================================

      const previousSubmission =
        await ShotSubmission.findOne({
          where: {
            shotId,
          },
          order: [["version", "DESC"]],
        });

      const version = previousSubmission
        ? previousSubmission.version + 1
        : 1;

      // ===================================================
      // Get Google Drive version folder
      // ===================================================

      const folders =
        await googleDriveService.getShotUnderReviewFolder(
          project.name,
          shot.shotNumber,
          version,
        );

      const versionFolderId =
        folders.versionFolderId;

      // ===================================================
      // Create ONE submission record
      // ===================================================

      const submission =
        await ShotSubmission.create({
          shotId : shotId as string,
          submittedBy,
          version,
          videoLength: video
            ? videoLength
            : 0,
          status: SubmissionStatus.submitted,
        });

      const createdFiles = [];

      try {
        // =================================================
        // Upload VIDEO
        // =================================================

        if (video) {
          const driveFileName =
            `v${version}_${video.originalname}`;

          const uploadedFile =
            await googleDriveService.uploadFileToDrive(
              video.path,
              driveFileName,
              video.mimetype,
              versionFolderId,
            );

          if (!uploadedFile.id) {
            throw new Error(
              "Video upload to Google Drive failed",
            );
          }

          const submissionFile =
            await SubmissionFile.create({
              submissionId: submission.id,
              fileType: SubmissionFileType.video,
              driveFileId: uploadedFile.id,
              driveFileUrl:
                uploadedFile.webViewLink ?? null,
              fileName:
                video.originalname,
              fileSize:
                video.size,
            });

          createdFiles.push(submissionFile);
        }

        // =================================================
        // Upload PROJECT FILES
        // =================================================

        for (const projectFile of projectFiles) {
          const driveFileName =
            `v${version}_${projectFile.originalname}`;

          const uploadedFile =
            await googleDriveService.uploadFileToDrive(
              projectFile.path,
              driveFileName,
              projectFile.mimetype,
              versionFolderId,
            );

          if (!uploadedFile.id) {
            throw new Error(
              `Project file upload failed: ${projectFile.originalname}`,
            );
          }

          const submissionFile =
            await SubmissionFile.create({
              submissionId: submission.id,
              fileType:
                SubmissionFileType.projectFile,
              driveFileId:
                uploadedFile.id,
              driveFileUrl:
                uploadedFile.webViewLink ?? null,
              fileName:
                projectFile.originalname,
              fileSize:
                projectFile.size,
            });

          createdFiles.push(submissionFile);
        }
      } catch (uploadError) {
        // ================================================
        // Cleanup uploaded Drive files if upload fails
        // ================================================

        for (const createdFile of createdFiles) {
          try {
            await googleDriveService.deleteFile(
              createdFile.driveFileId,
            );
          } catch (deleteError) {
            console.error(
              "Failed to cleanup Drive file:",
              deleteError,
            );
          }
        }

        // Delete submission
        await SubmissionFile.destroy({
          where: {
            submissionId: submission.id,
          },
        });

        await submission.destroy();

        throw uploadError;
      }

      // ===================================================
      // Delete temporary uploaded files
      // ===================================================

      if (video?.path && fs.existsSync(video.path)) {
        fs.unlinkSync(video.path);
      }

      for (const projectFile of projectFiles) {
        if (
          projectFile.path &&
          fs.existsSync(projectFile.path)
        ) {
          fs.unlinkSync(projectFile.path);
        }
      }

      // ===================================================
      // Update shot status
      // ===================================================

      await ProjectShot.update(
        {
          status: ShotStatus.submitted,
        },
        {
          where: {
            id: shotId,
          },
        },
      );

      // ===================================================
      // Notify Project Manager
      // ===================================================

      await NotificationService.createNotification({
        senderId: submittedBy,

        receiverId:
          project.projectManagerId as string,

        title:
          "New Shot Submission",

        message:
          `Shot ${shot.shotNumber} has been submitted for review.`,

        type:
          NotificationType.shotSubmitted,

        url:
          `/project-manager/shots/${shotId}/review`,
      });

      // ===================================================
      // Fetch complete submission
      // ===================================================

      const completeSubmission =
        await ShotSubmission.findByPk(
          submission.id,
          {
            include: [
              {
                model: SubmissionFile,
                as: "files",
              },
            ],
          },
        );

      // ===================================================
      // Response
      // ===================================================

      return sendResponse(
        res,
        201,
        "Shot submitted successfully",
        {
          version,
          submission:
            completeSubmission,
        },
      );

    } catch (error) {
      console.error(
        "Shot Submission Error:",
        error,
      );

      // ================================================
      // Cleanup temporary files
      // ================================================

      try {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        const video = files?.video?.[0];

        const projectFiles =
          files?.projectFiles || [];

        if (
          video?.path &&
          fs.existsSync(video.path)
        ) {
          fs.unlinkSync(video.path);
        }

        for (const projectFile of projectFiles) {
          if (
            projectFile.path &&
            fs.existsSync(projectFile.path)
          ) {
            fs.unlinkSync(projectFile.path);
          }
        }
      } catch (cleanupError) {
        console.error(
          "Temporary file cleanup error:",
          cleanupError,
        );
      }

      return sendResponse(
        res,
        500,
        "Failed to submit shot",
      );
    }
  }

  // =====================================================
  // GET ALL SUBMISSIONS OF SHOT
  // =====================================================

  static async getAllSubmissionsOfShot(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {
      const { shotId } = req.params;

      if (!shotId) {
        return sendResponse(
          res,
          400,
          "Shot ID is required!",
        );
      }

      // Check shot exists
      const shot =
        await ProjectShot.findByPk(shotId as string);

      if (!shot) {
        return sendResponse(
          res,
          404,
          "Shot not found!",
        );
      }

      const submissions =
        await ShotSubmission.findAll({
          where: {
            shotId,
          },

          include: [
            {
              model: SubmissionFile,
              as: "files",
            },
          ],

          order: [
            ["version", "DESC"],
            ["createdAt", "DESC"],
          ],
        });

      return sendResponse(
        res,
        200,
        "Submissions fetched successfully",
        submissions,
      );

    } catch (error) {
      console.error(
        "Get Submissions Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch submissions",
      );
    }
  }

  // =====================================================
  // GET SUBMISSION BY ID
  // =====================================================

  static async getSubmissionById(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {
      const { submissionId } = req.params;

      if (!submissionId) {
        return sendResponse(
          res,
          400,
          "Submission ID is required!",
        );
      }

      const submission =
        await ShotSubmission.findByPk(
          submissionId as string,
          {
            include: [
              {
                model: SubmissionFile,
                as: "files",
              },
            ],
          },
        );

      if (!submission) {
        return sendResponse(
          res,
          404,
          "Submission not found!",
        );
      }

      return sendResponse(
        res,
        200,
        "Submission fetched successfully",
        submission,
      );

    } catch (error) {
      console.error(
        "Get Submission Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to fetch submission",
      );
    }
  }

  // =====================================================
  // DELETE SUBMISSION BY ID
  // =====================================================

  static async deleteSubmissionById(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {
      const { submissionId } = req.params;

      if (!submissionId) {
        return sendResponse(
          res,
          400,
          "Submission ID is required!",
        );
      }

      const submission =
        await ShotSubmission.findByPk(
          submissionId as string,
        );

      if (!submission) {
        return sendResponse(
          res,
          404,
          "Submission not found!",
        );
      }

      // ================================================
      // Approved submission cannot be deleted
      // ================================================

      if (
        submission.status ===
        SubmissionStatus.approved
      ) {
        return sendResponse(
          res,
          400,
          "Approved submission cannot be deleted!",
        );
      }

      // ================================================
      // Find all submission files
      // ================================================

      const submissionFiles =
        await SubmissionFile.findAll({
          where: {
            submissionId,
          },
        });

      // ================================================
      // Delete files from Google Drive
      // ================================================

      for (const file of submissionFiles) {
        try {
          await googleDriveService.deleteFile(
            file.driveFileId,
          );
        } catch (driveError) {
          console.error(
            `Failed to delete Drive file ${file.driveFileId}:`,
            driveError,
          );
        }
      }

      // ================================================
      // Delete SubmissionFile records
      // ================================================

      await SubmissionFile.destroy({
        where: {
          submissionId,
        },
      });

      // ================================================
      // Delete ShotSubmission
      // ================================================

      await submission.destroy();

      // ================================================
      // Return response
      // ================================================

      return sendResponse(
        res,
        200,
        "Submission deleted successfully",
      );

    } catch (error) {
      console.error(
        "Delete Submission Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to delete submission",
      );
    }
  }
}

export default ShotSubmissionControllers;