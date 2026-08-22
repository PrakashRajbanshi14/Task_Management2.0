import { Response } from "express";

import {
  IExtendedRequest,
  ReviewStatus,
  SubmissionStatus,
  SubmissionFileType,
  ShotStatus,
  NotificationType,
} from "../globals/types";

import { sendResponse } from "../utils/sendResponse";

import ShotSubmission from "../database/models/shotSubmissionModel";
import SubmissionFile from "../database/models/submissionFileModel";
import ShotReview from "../database/models/shotReviewModel";
import ProjectShot from "../database/models/projectShotModel";
import Project from "../database/models/projectModel";

import EmployeeWorkDetail from "../database/models/employeeWorkDetailModel";
import EmployeeWorkShot from "../database/models/employeeWorkShotModel";

import googleDriveService from "../services/googleDriveService";
import NotificationService from "../services/notificationService";

class ShotReviewControllers {

  // =====================================================
  // APPROVE SUBMISSION
  // =====================================================

  static async approveSubmission(
    req: IExtendedRequest,
    res: Response,
  ) {
    try {

      // =================================================
      // Authentication
      // =================================================

      const reviewerId = req.user?.id;

      if (!reviewerId) {
        return sendResponse(
          res,
          401,
          "Please login!",
        );
      }


      // =================================================
      // Get submission ID
      // =================================================

      const { submissionId } = req.params;

      if (!submissionId) {
        return sendResponse(
          res,
          400,
          "Submission ID is required!",
        );
      }


      // =================================================
      // Find submission
      // =================================================

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


      // =================================================
      // Check submission status
      // =================================================

      if (
        submission.status ===
        SubmissionStatus.approved
      ) {
        return sendResponse(
          res,
          400,
          "Submission is already approved!",
        );
      }


      // =================================================
      // Get shot
      // =================================================

      const shot =
        await ProjectShot.findByPk(
          submission.shotId,
        );

      if (!shot) {
        return sendResponse(
          res,
          404,
          "Shot not found!",
        );
      }


      // =================================================
      // Get project
      // =================================================

      const project =
        await Project.findByPk(
          shot.projectId,
        );

      if (!project) {
        return sendResponse(
          res,
          404,
          "Project not found!",
        );
      }


      // =================================================
      // Get all files belonging to this submission
      // =================================================

      const submissionFiles =
        await SubmissionFile.findAll({
          where: {
            submissionId:
              submission.id,
          },
        });

      if (
        submissionFiles.length === 0
      ) {
        return sendResponse(
          res,
          404,
          "No files found for this submission!",
        );
      }


      // =================================================
      // Get destination folders
      // =================================================

      const folders =
        await googleDriveService
          .getShotDestinationFolders(
            project.name,
            shot.shotNumber,
          );


      // =================================================
      // Move submitted files
      // =================================================

      for (
        const submissionFile
        of submissionFiles
      ) {

        let destinationFolderId: string;


        // ---------------------------------------------
        // Video
        // ---------------------------------------------

        if (
          submissionFile.fileType ===
          SubmissionFileType.video
        ) {

          destinationFolderId =
            folders.finalVideoFolderId;

        }


        // ---------------------------------------------
        // Project files
        // ---------------------------------------------

        else if (
          submissionFile.fileType ===
          SubmissionFileType.projectFile
        ) {

          destinationFolderId =
            folders.projectFilesFolderId;

        }


        // ---------------------------------------------
        // Unknown file type
        // ---------------------------------------------

        else {

          throw new Error(
            `Unknown submission file type: ${submissionFile.fileType}`,
          );

        }


        // =================================================
        // Remove version prefix
        // =================================================

        /*
          Files inside Google Drive are uploaded as:

          v1_final.mp4
          v1_project.zip

          But the database normally stores:

          final.mp4
          project.zip

          This check also protects older records
          where the prefix may already exist.
        */

        const versionPrefix =
          `v${submission.version}_`;

        let finalFileName =
          submissionFile.fileName;


        if (
          finalFileName.startsWith(
            versionPrefix,
          )
        ) {

          finalFileName =
            finalFileName.substring(
              versionPrefix.length,
            );

        }


        // =================================================
        // Rename file
        // =================================================

        await googleDriveService.renameFile(
          submissionFile.driveFileId,
          finalFileName,
        );


        // =================================================
        // Move file
        // =================================================

        await googleDriveService.moveFile(
          submissionFile.driveFileId,
          destinationFolderId,
        );


        // =================================================
        // Update Drive URL
        // =================================================

        try {

          const updatedFile =
            await googleDriveService.getFile(
              submissionFile.driveFileId,
            );


          if (
            updatedFile?.webViewLink
          ) {

            await submissionFile.update({
              driveFileUrl:
                updatedFile.webViewLink,
            });

          }

        } catch (error) {

          console.error(
            "Unable to update Drive file URL:",
            error,
          );

        }

      }


      // =================================================
      // Mark submission as approved
      // =================================================

      await submission.update({
        status:
          SubmissionStatus.approved,
      });


      // =================================================
      // Update shot status
      // =================================================

      await ProjectShot.update(
        {
          status:
            ShotStatus.approved,
        },
        {
          where: {
            id: submission.shotId,
          },
        },
      );


      // =================================================
      // Create Shot Review
      // =================================================

      const review =
        await ShotReview.create({

          submissionId:
            submission.id,

          reviewedBy:
            reviewerId,

          status:
            ReviewStatus.approved,

          comment:
            null,

        });


      // =================================================
      // EMPLOYEE WORK DETAILS
      // =================================================

      /*
        The work should be recorded under the month
        and year in which the submission was approved.
      */

      const approvalDate =
        new Date();

      const month =
        approvalDate.getMonth() + 1;

      const year =
        approvalDate.getFullYear();


      // =================================================
      // Find existing monthly work detail
      // =================================================

      let workDetail =
        await EmployeeWorkDetail.findOne({
          where: {

            employeeId:
              submission.submittedBy,

            month,

            year,

          },
        });


      // =================================================
      // Create monthly work detail if it doesn't exist
      // =================================================

      if (!workDetail) {

        workDetail =
          await EmployeeWorkDetail.create({

            employeeId:
              submission.submittedBy,

            month,

            year,

            totalVideoLength:
              0,

            salaryStatus:
              "unpaid" as any,

            salaryAmount:
              null,

            notes:
              null,

          });

      }


      // =================================================
      // Check whether this shot is already recorded
      // =================================================

      const existingWorkShot =
        await EmployeeWorkShot.findOne({
          where: {

            workDetailId:
              workDetail.id,

            shotId:
              shot.id,

          },
        });


      /*
        Normally a submission should only be recorded
        once after approval.

        This protection prevents duplicate work records
        if the approve endpoint is accidentally called
        again.
      */

      if (!existingWorkShot) {

        await EmployeeWorkShot.create({

          workDetailId:
            workDetail.id,

          projectId:
            shot.projectId,

          shotId:
            shot.id,

          videoLength:
            submission.videoLength as number,

        });


        // =================================================
        // Update total monthly video length
        // =================================================

        const currentTotal =
          Number(
            workDetail.totalVideoLength || 0,
          );

        const submittedVideoLength =
          Number(
            submission.videoLength || 0,
          );


        await workDetail.update({

          totalVideoLength:
            currentTotal +
            submittedVideoLength,

        });

      }


      // =================================================
      // Notify employee
      // =================================================

      await NotificationService.createNotification({

        senderId:
          reviewerId,

        receiverId:
          submission.submittedBy,

        title:
          "Shot Approved",

        message:
          `Your shot submission v${submission.version} has been approved.`,

        type:
          NotificationType.submissionApproved,

        url:
          `/employee/shots/${submission.shotId}`,

      });


      // =================================================
      // Find version folder
      // =================================================

      const versionFolder =
        await googleDriveService.findFolder(
          `v${submission.version}`,
          folders.underReviewFolderId,
        );


      // =================================================
      // Delete version folder
      // =================================================

      if (
        versionFolder?.id
      ) {

        await googleDriveService.deleteFolder(
          versionFolder.id,
        );

      }


      // =================================================
      // Response
      // =================================================

      return sendResponse(
        res,
        200,
        "Submission approved successfully",
        {

          review,

          submissionId:
            submission.id,

          shotId:
            submission.shotId,

          version:
            submission.version,

          status:
            SubmissionStatus.approved,

          filesMoved:
            submissionFiles.length,

          workDetailId:
            workDetail.id,

        },
      );

    } catch (error) {

      console.error(
        "Approve Submission Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to approve submission",
      );

    }
  }


  // =====================================================
  // REQUEST REDO
  // =====================================================

  static async requestRedo(
    req: IExtendedRequest,
    res: Response,
  ) {

    try {

      // =================================================
      // Authentication
      // =================================================

      const reviewerId =
        req.user?.id;

      if (!reviewerId) {

        return sendResponse(
          res,
          401,
          "Please login!",
        );

      }


      // =================================================
      // Get submission ID and comment
      // =================================================

      const { submissionId } =
        req.params;

      const { comment } =
        req.body;


      if (!submissionId) {

        return sendResponse(
          res,
          400,
          "Submission ID is required!",
        );

      }


      if (
        !comment ||
        !comment.trim()
      ) {

        return sendResponse(
          res,
          400,
          "Comment is required!",
        );

      }


      // =================================================
      // Find submission
      // =================================================

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


      // =================================================
      // Cannot redo approved submission
      // =================================================

      if (
        submission.status ===
        SubmissionStatus.approved
      ) {

        return sendResponse(
          res,
          400,
          "Approved submission cannot be sent for redo!",
        );

      }


      // =================================================
      // Update submission status
      // =================================================

      await submission.update({

        status:
          SubmissionStatus.redoRequired,

      });


      // =================================================
      // Update shot status
      // =================================================

      await ProjectShot.update(
        {

          status:
            ShotStatus.redo,

        },
        {

          where: {

            id:
              submission.shotId,

          },

        },
      );


      // =================================================
      // Create review
      // =================================================

      const review =
        await ShotReview.create({

          submissionId:
            submission.id,

          reviewedBy:
            reviewerId,

          status:
            ReviewStatus.redoRequired,

          comment:
            comment.trim(),

        });


      // =================================================
      // Notify employee
      // =================================================

      await NotificationService.createNotification({

        senderId:
          reviewerId,

        receiverId:
          submission.submittedBy,

        title:
          "Shot Needs Revision",

        message:
          `Your shot submission v${submission.version} needs revision.`,

        type:
          NotificationType.submissionRedo,

        url:
          `/employee/shots/${submission.shotId}`,

      });


      // =================================================
      // Response
      // =================================================

      return sendResponse(
        res,
        200,
        "Redo requested successfully",
        review,
      );

    } catch (error) {

      console.error(
        "Request Redo Error:",
        error,
      );

      return sendResponse(
        res,
        500,
        "Failed to request submission redo",
      );

    }

  }

}

export default ShotReviewControllers;
