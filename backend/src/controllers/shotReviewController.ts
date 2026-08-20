import { Request, Response } from "express";

import User from "../database/models/userModel";
import ShotReview from "../database/models/shotReviewModel";
import ShotSubmission from "../database/models/shotSubmissionModel";
import { IExtendedRequest } from "../globals/types";
import { ReviewStatus, SubmissionStatus } from "../globals/types";

class ShotReviewController {
  // ==========================================
  // CREATE REVIEW
  // ==========================================

  async createReview(req: IExtendedRequest, res: Response) {
    try {
      const { submissionId } = req.params;

      const { status, comment } = req.body;

      // --------------------------------------
      // Validation
      // --------------------------------------

      if (!status) {
        return res.status(400).json({
          message: "Review status is required",
        });
      }

      // Validate status value
      if (!Object.values(ReviewStatus).includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values: ${Object.values(ReviewStatus).join(", ")}`,
        });
      }

      // Check if submission exists
      const submission = await ShotSubmission.findByPk(submissionId as string);

      if (!submission) {
        return res.status(404).json({
          message: "Submission not found",
        });
      }

      // Get reviewed by user
      const reviewedBy = req.user?.id;
      if (!reviewedBy) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      // Check if user exists
      const user = await User.findByPk(reviewedBy);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Check if review already exists for this submission
      const existingReview = await ShotReview.findOne({
        where: {
          submissionId: submissionId as string,
        },
      });

      if (existingReview) {
        return res.status(409).json({
          message: "A review already exists for this submission",
        });
      }

      // Create review
      const review = await ShotReview.create({
        submissionId: submissionId as string,

        reviewedBy,

        status,

        comment: comment || null,
      });

      // Update submission status based on review
      let newSubmissionStatus = SubmissionStatus.approved;
      if (status === ReviewStatus.redoRequired) {
        newSubmissionStatus = SubmissionStatus.redoRequired;
      } else if (status === ReviewStatus.approved) {
        newSubmissionStatus = SubmissionStatus.approved;
      }

      await submission.update({
        status: newSubmissionStatus,
      });

      return res.status(201).json({
        message: "Review created successfully",

        review,
      });
    } catch (error) {
      console.error("Create Review Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET REVIEW BY SUBMISSION ID
  // ==========================================

  async getReviewBySubmission(req: Request, res: Response) {
    try {
      const { submissionId } = req.params;

      // Check if submission exists
      const submission = await ShotSubmission.findByPk(submissionId as string);

      if (!submission) {
        return res.status(404).json({
          message: "Submission not found",
        });
      }

      // Get review
      const review = await ShotReview.findOne({
        where: {
          submissionId: submissionId as string,
        },

        include: [
          {
            model: User,

            as: "reviewer",

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

      if (!review) {
        return res.status(404).json({
          message: "No review found for this submission",
        });
      }

      return res.status(200).json({
        review,
      });
    } catch (error) {
      console.error("Get Review Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // GET ALL REVIEWS BY USER
  // ==========================================

  async getUserReviews(req: Request, res: Response) {
    try {
      const { reviewerId } = req.params;

      // Check if user exists
      const user = await User.findByPk(reviewerId as string);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Get all reviews by user
      const reviews = await ShotReview.findAll({
        where: {
          reviewedBy: reviewerId as string,
        },

        include: [
          {
            model: ShotSubmission,

            as: "submission",

            attributes: [
              "id",

              "shotId",

              "version",

              "fileName",

              "submittedAt",
            ],
          },
        ],

        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json({
        reviews,
      });
    } catch (error) {
      console.error("Get User Reviews Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // UPDATE REVIEW
  // ==========================================

  async updateReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;

      const { status, comment } = req.body;

      // Check if review exists
      const review = await ShotReview.findByPk(reviewId as string);

      if (!review) {
        return res.status(404).json({
          message: "Review not found",
        });
      }

      // Validate status if provided
      if (status && !Object.values(ReviewStatus).includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values: ${Object.values(ReviewStatus).join(", ")}`,
        });
      }

      // Update review
      await review.update({
        status: status || review.status,

        comment: comment !== undefined ? comment : review.comment,
      });

      // Get the submission to update its status
      const submission = await ShotSubmission.findByPk(review.submissionId);

      if (submission && status) {
        let newSubmissionStatus = SubmissionStatus.approved;
        if (status === ReviewStatus.redoRequired) {
          newSubmissionStatus = SubmissionStatus.redoRequired;
        } else if (status === ReviewStatus.approved) {
          newSubmissionStatus = SubmissionStatus.approved;
        }

        await submission.update({
          status: newSubmissionStatus,
        });
      }

      return res.status(200).json({
        message: "Review updated successfully",

        review,
      });
    } catch (error) {
      console.error("Update Review Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // ==========================================
  // DELETE REVIEW
  // ==========================================

  async deleteReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;

      // Check if review exists
      const review = await ShotReview.findByPk(reviewId as string);

      if (!review) {
        return res.status(404).json({
          message: "Review not found",
        });
      }

      // Get submission to reset status
      const submission = await ShotSubmission.findByPk(review.submissionId);

      if (submission) {
        await submission.update({
          status: SubmissionStatus.underReview,
        });
      }

      // Delete review
      await review.destroy();

      return res.status(200).json({
        message: "Review deleted successfully",
      });
    } catch (error) {
      console.error("Delete Review Error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new ShotReviewController();
