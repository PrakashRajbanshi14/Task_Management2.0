import express from "express"
import { accessToRoles, isUserLoggedIn } from "../middlewares/UserMiddleware"
import { UserRole } from "../globals/types"
import errorHandler from "../utils/errorHandler"
import ShotReviewControllers from "../controller/shotReviewController"
const router = express.Router()

router.post("/:submissionId/approve",
    isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager),
    errorHandler(ShotReviewControllers.approveSubmission)
)

router.post("/:submissionId/redo",
    isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager),
    errorHandler(ShotReviewControllers.requestRedo)
)


export default router
