import express from "express"
import errorHandler from "../utils/errorHandler"
import ProjectController from "../controller/projectControllers"
import { accessToRoles, isUserLoggedIn } from "../middlewares/UserMiddleware"
import { UserRole } from "../globals/types"
const router = express.Router()

router.route("/")
  .post(isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(ProjectController.createProject))
  .get(isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(ProjectController.getAllProjects));

router.route("/:projectId")
    .get(isUserLoggedIn, errorHandler(ProjectController.getProjectById))
    .patch(isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(ProjectController.updateProject))
    .delete(isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(ProjectController.deleteProject))

export default router

