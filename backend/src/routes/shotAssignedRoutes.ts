import express from "express"
import { accessToRoles, isUserLoggedIn } from "../middlewares/UserMiddleware";
import { UserRole } from "../globals/types";
import ShotAssignController from "../controller/shotAssignController";
import errorHandler from "../utils/errorHandler";
const router = express.Router()


router.route("/:shotId/employee/:employeeId")
    .post(isUserLoggedIn,accessToRoles(UserRole.ProjectManager,UserRole.Admin),errorHandler(ShotAssignController.assignShotToEmployee))
    .delete(isUserLoggedIn,accessToRoles(UserRole.ProjectManager,UserRole.Admin),errorHandler(ShotAssignController.removeShotAssignFromEmployee));

router.get(
  "/my-shots",
  isUserLoggedIn,
  accessToRoles(UserRole.Admin,UserRole.ProjectManager,UserRole.Employee),
  ShotAssignController.getAllAssignedShots
);
export default router
