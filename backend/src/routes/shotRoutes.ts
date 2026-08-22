import express from "express"
import { accessToRoles, isUserLoggedIn } from "../middlewares/UserMiddleware"
import { UserRole } from "../globals/types"
import errorHandler from "../utils/errorHandler"
import ShotController from "../controller/shotControllers"
const router = express.Router()

//create shot
router.route("/projects/:projectId/shots")
    .post( isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(ShotController.addShotToProject))
    .get( isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(ShotController.getAllShotsOfProject))
    
router.route("/:shotId")
    .get(isUserLoggedIn, errorHandler(ShotController.getShotById))
    .patch(isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(ShotController.updateShotDetails))
    .delete(isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(ShotController.deleteShotById))

export default router

