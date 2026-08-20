import express from "express";

import {
  accessToRoles,
  isUserLoggedIn,
} from "../middlewares/UserMiddleware";

import upload from "../middlewares/multerMiddleware";

import { UserRole } from "../globals/types";

import ShotSubmissionControllers
  from "../controller/shotSubmisionControllers";


const router = express.Router();


// ==========================================
// Submit Shot
// ==========================================

router.post(

  "/:shotId/submit",

  isUserLoggedIn,

  accessToRoles(
    UserRole.Employee
  ),

  upload.fields([

    {
      name: "video",
      maxCount: 1,
    },

    {
      name: "projectFiles",
      maxCount: 10,
    },

  ]),

  ShotSubmissionControllers.submitShot,

);


// ==========================================
// Get All Submissions Of A Shot
// ==========================================

router.get(

  "/shot/:shotId",

  isUserLoggedIn,

  accessToRoles(
    UserRole.Employee,
    UserRole.ProjectManager,
    UserRole.Admin
  ),

  ShotSubmissionControllers
    .getAllSubmissionsOfShot,

);


// ==========================================
// Get Submission By ID
// ==========================================

router.get(

  "/:submissionId",

  isUserLoggedIn,

  accessToRoles(
    UserRole.Employee,
    UserRole.ProjectManager,
    UserRole.Admin
  ),

  ShotSubmissionControllers
    .getSubmissionById,

);


// ==========================================
// Approve Submission
// ==========================================

router.patch(

  "/:submissionId/approve",

  isUserLoggedIn,

  accessToRoles(
    UserRole.ProjectManager,
    UserRole.Admin
  ),

  ShotSubmissionControllers
    .approveSubmission,

);


// ==========================================
// Update Submission Status
// ==========================================

router.patch(

  "/:submissionId/status",

  isUserLoggedIn,

  accessToRoles(
    UserRole.ProjectManager,
    UserRole.Admin
  ),

  ShotSubmissionControllers
    .updateSubmissionStatus,

);


// ==========================================
// Delete Submission
// ==========================================

// router.delete(

//   "/:submissionId",

//   isUserLoggedIn,

//   accessToRoles(
//     UserRole.ProjectManager,
//     UserRole.Admin
//   ),

//   ShotSubmissionControllers
//     .,

// );


export default router;