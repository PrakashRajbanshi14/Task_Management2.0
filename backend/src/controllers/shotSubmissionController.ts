import { Request, Response } from "express";

import Shot from "../database/models/projectShotModel";
import User from "../database/models/userModel";
import ShotSubmission from "../database/models/shotSubmissionModel";
import { IExtendedRequest } from "../globals/types";
import { SubmissionStatus, ShotStatus } from "../globals/types";

class ShotSubmissionController {
  // ==========================================
  // CREATE SHOT SUBMISSION
  // ==========================================

  async createSubmission(req: IExtendedRequest, res: Response) {
    try {
      const { shotId } = req.params;

      const {
        version,
        driveFileId,
        driveFileUrl,
        fileName,
        fileSize,
        mimeType,
      } = req.body;

      // --------------------------------------
      // Validation
      // --------------------------------------

      if (!version || !driveFileId || !fileName) {
        return res.status(400).json({
          message: "Version, driveFileId, and fileName are required",
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
      // Get submitted by user
      // --------------------------------------

      const submittedBy = req.user?.id;
      if (!submittedBy) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      // Check if user exists
      const user = await User.findByPk(submittedBy);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // --------------------------------------
      // Create submission
      // --------------------------------------

      const submission = await ShotSubmission.create({
        shotId: shotId as string,

        submittedBy,

        version,

        driveFileId,

        driveFileUrl,

        fileName,

        fileSize,

        mimeType,

        status: SubmissionStatus.submitted,

        submittedAt: new Date(),
      });

      // Update shot status to submitted
      await shot.update({
        status: ShotStatus.submitted,
      });

      return res.status(201).json({
        message: "Submission created successfully",

        submission,
      });
    } catch (error) {
      console.error("Create Submission Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET ALL SUBMISSIONS OF SHOT
  // ==========================================

  async getShotSubmissions(req: Request, res: Response) {
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
      // Get all submissions
      // --------------------------------------

      const submissions = await ShotSubmission.findAll({
        where: {
          shotId: shotId as string,
        },

        include: [
          {
            model: User,

            as: "submitter",

            attributes: [
              "id",

              "userName",

              "email",

              "fullName",

              "profileImage",
            ],
          },
        ],

        order: [["version", "DESC"]],
      });

      return res.status(200).json({
        submissions,
      });
    } catch (error) {
      console.error("Get Shot Submissions Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET SUBMISSION BY ID
  // ==========================================

  async getSubmissionById(req: Request, res: Response) {
    try {
      const { submissionId } = req.params;

      // --------------------------------------
      // Get submission
      // --------------------------------------

      const submission = await ShotSubmission.findByPk(submissionId as string, {
        include: [
          {
            model: User,

            as: "submitter",

            attributes: [
              "id",

              "userName",

              "email",

              "fullName",

              "profileImage",
            ],
          },
        ],
      });

      if (!submission) {
        return res.status(404).json({
          message: "Submission not found",
        });
      }

      return res.status(200).json({
        submission,
      });
    } catch (error) {
      console.error("Get Submission Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // UPDATE SUBMISSION STATUS
  // ==========================================

  async updateSubmissionStatus(req: Request, res: Response) {
    try {
      const { submissionId } = req.params;

      const { status } = req.body;

      // --------------------------------------
      // Validation
      // --------------------------------------

      if (!status) {
        return res.status(400).json({
          message: "Status is required",
        });
      }

      // Validate status value
      if (!Object.values(SubmissionStatus).includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values: ${Object.values(SubmissionStatus).join(", ")}`,
        });
      }

      // --------------------------------------
      // Get submission
      // --------------------------------------

      const submission = await ShotSubmission.findByPk(submissionId as string);

      if (!submission) {
        return res.status(404).json({
          message: "Submission not found",
        });
      }

      // Update submission status
      await submission.update({
        status,
      });

      return res.status(200).json({
        message: "Submission status updated successfully",

        submission,
      });
    } catch (error) {
      console.error("Update Submission Status Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // DELETE SUBMISSION
  // ==========================================

  async deleteSubmission(req: Request, res: Response) {
    try {
      const { submissionId } = req.params;

      // --------------------------------------
      // Check if submission exists
      // --------------------------------------

      const submission = await ShotSubmission.findByPk(submissionId as string);

      if (!submission) {
        return res.status(404).json({
          message: "Submission not found",
        });
      }

      // Delete submission
      await submission.destroy();

      return res.status(200).json({
        message: "Submission deleted successfully",
      });
    } catch (error) {
      console.error("Delete Submission Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new ShotSubmissionController();
