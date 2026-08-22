import express from "express"
import { accessToRoles, isUserLoggedIn } from "../middlewares/UserMiddleware"
import { UserRole } from "../globals/types"
import errorHandler from "../utils/errorHandler"
import projectAssignController from "../controller/projectAssignedControllers"
const router = express.Router()

router.route("/:projectId/employees")
    .post(isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(projectAssignController.assignEmployeesToProject))
    .get(isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(projectAssignController.getEmployeesOfProject))
    
router.get("/employees/:employeeId/projects", isUserLoggedIn, errorHandler(projectAssignController.getAllAssignedProjectOfEmployee))
router.delete("/:projectId/employee/:employeeId", isUserLoggedIn, accessToRoles(UserRole.Admin, UserRole.ProjectManager), errorHandler(projectAssignController.removeEmployeeFromProject))
export default router

