import { Response } from "express";

import {
  IExtendedRequest,
  ReviewStatus,
  SubmissionStatus,
  SubmissionFileType,
  ShotStatus,
} from "../globals/types";

import { sendResponse } from "../utils/sendResponse";

import ShotSubmission from "../database/models/shotSubmissionModel";

import ShotReview from "../database/models/shotReviewModel";

import ProjectShot from "../database/models/projectShotModel";

import Project from "../database/models/projectModel";

import googleDriveService from "../services/googleDriveService";

class ShotReviewControllers {
  // ==========================================
  // APPROVE SUBMISSION
  // ==========================================

  static async approveSubmission(req: IExtendedRequest, res: Response) {
    try {
      const reviewerId = req.user?.id;

      if (!reviewerId) {
        return sendResponse(res, 401, "Please login!");
      }

      const { submissionId } = req.params;

      if (!submissionId) {
        return sendResponse(res, 400, "Submission ID is required!");
      }

      // --------------------------------------
      // Find selected submission
      // --------------------------------------

      const submission = await ShotSubmission.findByPk(submissionId as string);

      if (!submission) {
        return sendResponse(res, 404, "Submission not found!");
      }

      // --------------------------------------
      // Check already approved
      // --------------------------------------

      if (submission.status === SubmissionStatus.approved) {
        return sendResponse(res, 400, "Submission is already approved!");
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
      // Get all files from same version
      // --------------------------------------

      const versionSubmissions = await ShotSubmission.findAll({
        where: {
          shotId: submission.shotId,

          version: submission.version,
        },
      });

      if (versionSubmissions.length === 0) {
        return sendResponse(res, 404, "No submission files found!");
      }

      // --------------------------------------
      // Get destination folders
      // --------------------------------------

      const folders = await googleDriveService.getShotDestinationFolders(
        project.name,

        shot.shotNumber,
      );

      // --------------------------------------
      // Move every file
      // --------------------------------------

      for (const currentSubmission of versionSubmissions) {
        let destinationFolderId: string;

        // Video
        if (currentSubmission.fileType === SubmissionFileType.video) {
          destinationFolderId = folders.finalVideoFolderId;
        }

        // Project files
        else if (
          currentSubmission.fileType === SubmissionFileType.projectFiles
        ) {
          destinationFolderId = folders.projectFilesFolderId;
        } else {
          throw new Error(`Unknown file type: ${currentSubmission.fileType}`);
        }

        // ------------------------------------
        // Remove temporary version prefix
        // ------------------------------------

        const prefix = `v${currentSubmission.version}_`;

        let finalFileName = currentSubmission.fileName;

        // In our DB fileName is already
        // the original filename.
        //
        // This extra check protects us if
        // old records contain the prefix.

        if (finalFileName.startsWith(prefix)) {
          finalFileName = finalFileName.substring(prefix.length);
        }

        // ------------------------------------
        // Rename
        // ------------------------------------

        await googleDriveService.renameFile(
          currentSubmission.driveFileId,

          finalFileName,
        );

        // ------------------------------------
        // Move
        // ------------------------------------

        await googleDriveService.moveFile(
          currentSubmission.driveFileId,

          destinationFolderId,
        );
      }

      // --------------------------------------
      // Mark all files in version approved
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
      // Update shot
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
      // Create review record
      // --------------------------------------

      const review = await ShotReview.create({
        shotId: submission.shotId as string,

        submissionId: submissionId as string,

        reviewedBy: reviewerId,

        status: ReviewStatus.approved,

        feedback: null,
      });

      // --------------------------------------
      // Delete version folder
      // --------------------------------------

      const versionFolder = await googleDriveService.findFolder(
        `v${submission.version}`,

        folders.underReviewFolderId,
      );

      if (versionFolder?.id) {
        await googleDriveService.deleteFolder(versionFolder.id);
      }

      return sendResponse(
        res,

        200,

        "Submission approved successfully",

        {
          review,

          shotId: submission.shotId,

          version: submission.version,

          status: SubmissionStatus.approved,

          filesMoved: versionSubmissions.length,
        },
      );
    } catch (error) {
      console.error("Approve Submission Error:", error);

      return sendResponse(res, 500, "Failed to approve submission");
    }
  }

  // ==========================================
  // REQUEST REDO
  // ==========================================

  static async requestRedo(req: IExtendedRequest, res: Response) {
    try {
      const reviewerId = req.user?.id;

      if (!reviewerId) {
        return sendResponse(res, 401, "Please login!");
      }

      const { submissionId } = req.params;

      const { feedback } = req.body;

      if (!submissionId) {
        return sendResponse(res, 400, "Submission ID is required!");
      }

      if (!feedback) {
        return sendResponse(res, 400, "Feedback is required!");
      }

      // --------------------------------------
      // Find submission
      // --------------------------------------

      const submission = await ShotSubmission.findByPk(submissionId as string);

      if (!submission) {
        return sendResponse(res, 404, "Submission not found!");
      }

      // --------------------------------------
      // Update all files in version
      // --------------------------------------

      await ShotSubmission.update(
        {
          status: SubmissionStatus.redoRequired,
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
          status: ShotStatus.redo,
        },

        {
          where: {
            id: submission.shotId,
          },
        },
      );

      // Create review
      const review = await ShotReview.create({
        shotId: submission.shotId,
        submissionId: submissionId as string,
        reviewedBy: reviewerId,
        status: ReviewStatus.redoRequired,
        feedback,
      });

      return sendResponse(res, 200, "Redo requested successfully", review);
    } catch (error) {
      console.error("Request Redo Error:", error);

      return sendResponse(res, 500, "Failed to request redo");
    }
  }
}

export default ShotReviewControllers;
