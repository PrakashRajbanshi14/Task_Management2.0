import { Response } from "express";
import fs from "fs";

import {
  IExtendedRequest,
  SubmissionStatus,
  SubmissionFileType,
  ShotStatus,
} from "../globals/types";

import { sendResponse } from "../utils/sendResponse";

import ProjectShot from "../database/models/projectShotModel";

import ShotAssigned from "../database/models/shotAssignedModel";

import ShotSubmission from "../database/models/shotSubmissionModel";

import Project from "../database/models/projectModel";

import googleDriveService from "../services/googleDriveService";

class ShotSubmissionControllers {
  // SUBMIT SHOT
  static async submitShot(req: IExtendedRequest, res: Response) {
    try {
      // --------------------------------------
      // Authentication
      // --------------------------------------

      const submittedBy = req.user?.id;

      if (!submittedBy) {
        return sendResponse(res, 401, "Please login!");
      }

      // --------------------------------------
      // Shot ID
      // --------------------------------------

      const shotId = req.params.shotId as string;

      if (!shotId) {
        return sendResponse(res, 400, "Shot ID is required!");
      }

      // --------------------------------------
      // Get uploaded files
      // --------------------------------------

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const video = files?.video?.[0];

      const projectFiles = files?.projectFiles || [];

      // --------------------------------------
      // Check at least one file
      // --------------------------------------

      if (!video && projectFiles.length === 0) {
        return sendResponse(res, 400, "Please upload a video or project file!");
      }

      // --------------------------------------
      // Find shot
      // --------------------------------------

      const shot = await ProjectShot.findByPk(shotId);

      if (!shot) {
        return sendResponse(res, 404, "Shot not found!");
      }

      // --------------------------------------
      // Check employee assignment
      // --------------------------------------

      const assignment = await ShotAssigned.findOne({
        where: {
          shotId,

          employeeId: submittedBy,
        },
      });

      if (!assignment) {
        return sendResponse(res, 403, "This shot is not assigned to you!");
      }

      // --------------------------------------
      // Get project
      // --------------------------------------

      const project = await Project.findByPk(shot.projectId);

      if (!project) {
        return sendResponse(res, 404, "Project not found!");
      }

      // --------------------------------------
      // Determine version
      // --------------------------------------

      const previousSubmission = await ShotSubmission.findOne({
        where: {
          shotId,
        },

        order: [["createdAt", "DESC"]],
      });

      let version = 1;

      if (previousSubmission) {
        version = previousSubmission.version + 1;
      }

      // --------------------------------------
      // Get Google Drive folder
      // --------------------------------------

      const folders = await googleDriveService.getShotUnderReviewFolder(
        project.name,
        shot.shotNumber,
        version,
      );

      const versionFolderId = folders.versionFolderId;

      // --------------------------------------
      // Prepare files
      // --------------------------------------

      const filesToUpload: {
        file: Express.Multer.File;
        fileType: SubmissionFileType;
      }[] = [];

      // Video

      if (video) {
        filesToUpload.push({
          file: video,

          fileType: SubmissionFileType.video,
        });
      }

      // Project files

      for (const projectFile of projectFiles) {
        filesToUpload.push({
          file: projectFile,

          fileType: SubmissionFileType.projectFiles,
        });
      }

      // --------------------------------------
      // Upload and save
      // --------------------------------------

      const submissions = [];

      for (const item of filesToUpload) {
        const file = item.file;

        // Google Drive file name

        const driveFileName = `v${version}_${file.originalname}`;

        // Upload to Google Drive

        const uploadedFile = await googleDriveService.uploadFileToDrive(
          file.path,
          driveFileName,
          file.mimetype,
          versionFolderId,
        );

        if (!uploadedFile.id) {
          throw new Error(`Failed to upload ${file.originalname}`);
        }

        // Save database record

        const submission = await ShotSubmission.create({
          shotId,

          submittedBy,

          version,

          driveFileId: uploadedFile.id,

          driveFileUrl: uploadedFile.webViewLink ?? null,

          fileName: file.originalname,

          fileSize: file.size,

          mimeType: file.mimetype,

          fileType: item.fileType,

          status: SubmissionStatus.submitted,
        });

        submissions.push(submission);

        // Delete temporary file

        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }

      // --------------------------------------
      // Update shot status
      // --------------------------------------

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

      // --------------------------------------
      // Response
      // --------------------------------------

      return sendResponse(
        res,

        201,

        "Shot submitted successfully",

        {
          version,

          files: submissions,
        },
      );
    } catch (error) {
      console.error("Shot Submission Error:", error);

      // Delete temporary files
      // if something goes wrong

      if (req.files) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        const allFiles = Object.values(files).flat();

        for (const file of allFiles) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }

      return sendResponse(res, 500, "Failed to submit shot");
    }
  }

  // ==========================================
  // GET ALL SUBMISSIONS OF A SHOT
  // ==========================================

  static async getAllSubmissionsOfShot(req: IExtendedRequest, res: Response) {
    try {
      const { shotId } = req.params;

      const userId = req.user?.id;

      if (!userId) {
        return sendResponse(res, 401, "Please login!");
      }

      if (!shotId) {
        return sendResponse(res, 400, "Shot ID is required!");
      }

      // --------------------------------------
      // Check shot exists
      // --------------------------------------

      const shot = await ProjectShot.findByPk(shotId as string);

      if (!shot) {
        return sendResponse(res, 404, "Shot not found!");
      }

      // --------------------------------------
      // Get submissions
      // --------------------------------------

      const submissions = await ShotSubmission.findAll({
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
        "Shot submissions fetched successfully",
        submissions,
      );
    } catch (error) {
      console.error("Get All Shot Submissions Error:", error);

      return sendResponse(res, 500, "Failed to fetch shot submissions");
    }
  }

  // ==========================================
  // GET SUBMISSION BY ID
  // ==========================================

  static async getSubmissionById(req: IExtendedRequest, res: Response) {
    try {
      const { submissionId } = req.params;

      const userId = req.user?.id;

      if (!userId) {
        return sendResponse(res, 401, "Please login!");
      }

      if (!submissionId) {
        return sendResponse(res, 400, "Submission ID is required!");
      }

      // --------------------------------------
      // Find submission
      // --------------------------------------

      const submission = await ShotSubmission.findByPk(submissionId as string);

      if (!submission) {
        return sendResponse(res, 404, "Submission not found!");
      }

      return sendResponse(
        res,
        200,
        "Submission fetched successfully",
        submission,
      );
    } catch (error) {
      console.error("Get Submission Error:", error);

      return sendResponse(res, 500, "Failed to fetch submission");
    }
  }

  // ==========================================
  // UPDATE SUBMISSION STATUS
  // ==========================================

  static async updateSubmissionStatus(req: IExtendedRequest, res: Response) {
    try {
      const { submissionId } = req.params;

      const { status } = req.body;

      const userId = req.user?.id;

      // --------------------------------------
      // Authentication
      // --------------------------------------

      if (!userId) {
        return sendResponse(res, 401, "Please login!");
      }

      // --------------------------------------
      // Validate submission ID
      // --------------------------------------

      if (!submissionId) {
        return sendResponse(res, 400, "Submission ID is required!");
      }

      // --------------------------------------
      // Validate status
      // --------------------------------------

      if (!status) {
        return sendResponse(res, 400, "Status is required!");
      }

      const allowedStatuses = [
        SubmissionStatus.submitted,
        SubmissionStatus.underReview,
        SubmissionStatus.approved,
        SubmissionStatus.redoRequired,
      ];

      if (!allowedStatuses.includes(status)) {
        return sendResponse(res, 400, "Invalid submission status!");
      }

      // --------------------------------------
      // Find submission
      // --------------------------------------

      const submission = await ShotSubmission.findByPk(submissionId as string);

      if (!submission) {
        return sendResponse(res, 404, "Submission not found!");
      }

      // --------------------------------------
      // Update status
      // --------------------------------------

      await submission.update({
        status,
      });

      return sendResponse(
        res,
        200,
        "Submission status updated successfully",
        submission,
      );
    } catch (error) {
      console.error("Update Submission Status Error:", error);

      return sendResponse(res, 500, "Failed to update submission status");
    }
  }

  // ==========================================
  // APPROVE SUBMISSION
  // ==========================================

  static async approveSubmission(req: IExtendedRequest, res: Response) {
    try {
      // --------------------------------------
      // Authentication
      // --------------------------------------

      const userId = req.user?.id;

      if (!userId) {
        return sendResponse(res, 401, "Please login!");
      }

      // --------------------------------------
      // Submission ID
      // --------------------------------------

      const { submissionId } = req.params;

      if (!submissionId) {
        return sendResponse(res, 400, "Submission ID is required!");
      }

      // --------------------------------------
      // Find submission
      // --------------------------------------

      const submission = await ShotSubmission.findByPk(submissionId as string);

      if (!submission) {
        return sendResponse(res, 404, "Submission not found!");
      }

      // --------------------------------------
      // Check current status
      // --------------------------------------

      if (submission.status === SubmissionStatus.approved) {
        return sendResponse(res, 400, "This submission is already approved!");
      }

      // --------------------------------------
      // Get shot
      // --------------------------------------

      const shot = await ProjectShot.findByPk(submission.shotId);

      if (!shot) {
        return sendResponse(res, 404, "Shot not found!");
      }

      // --------------------------------------
      // Get project
      // --------------------------------------

      const project = await Project.findByPk(shot.projectId);

      if (!project) {
        return sendResponse(res, 404, "Project not found!");
      }

      // --------------------------------------
      // Find all files belonging to
      // the same submission version
      // --------------------------------------

      const versionSubmissions = await ShotSubmission.findAll({
        where: {
          shotId: submission.shotId,

          version: submission.version,
        },
      });

      if (versionSubmissions.length === 0) {
        return sendResponse(
          res,
          404,
          "No files found for this submission version!",
        );
      }

      // --------------------------------------
      // Get destination folders
      // --------------------------------------

      const folders = await googleDriveService.getShotDestinationFolders(
        project.name,

        shot.shotNumber,
      );
      // --------------------------------------
      // Move and rename files
      // --------------------------------------

      for (const currentSubmission of versionSubmissions) {
        let destinationFolderId: string;

        // ------------------------------------
        // Determine destination
        // ------------------------------------

        if (currentSubmission.fileType === SubmissionFileType.video) {
          destinationFolderId = folders.finalVideoFolderId;
        } else if (
          currentSubmission.fileType === SubmissionFileType.projectFiles
        ) {
          destinationFolderId = folders.projectFilesFolderId;
        } else {
          return sendResponse(
            res,
            400,
            `Unknown file type: ${currentSubmission.fileType}`,
          );
        }

        // ------------------------------------
        // Remove version prefix
        // ------------------------------------

        const prefix = `v${currentSubmission.version}_`;

        let finalFileName = currentSubmission.fileName;

        if (finalFileName.startsWith(prefix)) {
          finalFileName = finalFileName.substring(prefix.length);
        }

        // ------------------------------------
        // Rename file
        // ------------------------------------

        await googleDriveService.renameFile(
          currentSubmission.driveFileId,

          finalFileName,
        );

        // ------------------------------------
        // Move file
        // ------------------------------------

        await googleDriveService.moveFile(
          currentSubmission.driveFileId,

          destinationFolderId,
        );
      }

      // --------------------------------------
      // Update all files of this version
      // --------------------------------------

      await ShotSubmission.update(
        {
          status: SubmissionStatus.approved,
        },

        {
          where: {
            shotId: submission.shotId,

            version: submission.version,
          },
        },
      );

      // --------------------------------------
      // Update shot status
      // --------------------------------------

      await ProjectShot.update(
        {
          status: ShotStatus.approved,
        },

        {
          where: {
            id: submission.shotId,
          },
        },
      );

      // --------------------------------------
      // Response
      // --------------------------------------

      return sendResponse(
        res,

        200,

        "Submission approved and files moved successfully",

        {
          shotId: submission.shotId,

          version: submission.version,

          filesMoved: versionSubmissions.length,

          status: SubmissionStatus.approved,
        },
      );
    } catch (error) {
      console.error("Approve Submission Error:", error);

      return sendResponse(res, 500, "Failed to approve submission");
    }
  }

  // ==========================================
// DELETE SUBMISSION BY ID
// ==========================================

static async deleteSubmissionById(
  req: IExtendedRequest,
  res: Response
) {
  try {

    // --------------------------------------
    // Authentication
    // --------------------------------------

    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(
        res,
        401,
        "Please login!"
      );
    }


    // --------------------------------------
    // Submission ID
    // --------------------------------------

    const { submissionId } = req.params;

    if (!submissionId) {
      return sendResponse(
        res,
        400,
        "Submission ID is required!"
      );
    }


    // --------------------------------------
    // Find submission
    // --------------------------------------

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


    // --------------------------------------
    // Delete file from Google Drive
    // --------------------------------------

    if (submission.driveFileId) {

      await googleDriveService.deleteFile(
        submission.driveFileId
      );

    }


    // --------------------------------------
    // Delete database record
    // --------------------------------------

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
