import express from "express"

import authMiddleware
    from "../middlewares/authMiddleware"

import accessTo
    from "../middlewares/roleMiddleware"

import { UserRole } from "../globals/types"
import shotSubmissionController from "../controllers/shotSubmissionController"


const router = express.Router()


// ==========================================
// CREATE SHOT SUBMISSION
// ==========================================

router.post(

    "/:shotId/submissions",

    authMiddleware,

    (req, res) => shotSubmissionController.createSubmission(req as any, res)

)


// ==========================================
// GET ALL SUBMISSIONS OF SHOT
// ==========================================

router.get(

    "/:shotId/submissions",

    authMiddleware,

    shotSubmissionController.getShotSubmissions

)


// ==========================================
// GET SUBMISSION BY ID
// ==========================================

router.get(

    "/submissions/:submissionId",

    authMiddleware,

    shotSubmissionController.getSubmissionById

)


// ==========================================
// UPDATE SUBMISSION STATUS
// ==========================================

router.patch(

    "/submissions/:submissionId/status",

    authMiddleware,

    accessTo(
        UserRole.ProjectManager,
        UserRole.Admin
    ),

    shotSubmissionController.updateSubmissionStatus

)


// ==========================================
// DELETE SUBMISSION
// ==========================================

router.delete(

    "/submissions/:submissionId",

    authMiddleware,

    accessTo(
        UserRole.ProjectManager,
        UserRole.Admin
    ),

    shotSubmissionController.deleteSubmission

)


export default router
