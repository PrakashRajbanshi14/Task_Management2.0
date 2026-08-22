import express from "express";

import {
  accessToRoles,
  isUserLoggedIn,
} from "../middlewares/UserMiddleware";

import {
  UserRole,
} from "../globals/types";
import EmployeeWorkShotControllers from "../controller/employeeWrokShotControllers";

const router = express.Router();


// ==========================================
// EMPLOYEE → MY WORK SHOTS
// ==========================================

router.get(
  "/my/:workDetailId",

  isUserLoggedIn,

  accessToRoles(
    UserRole.Employee,
  ),

  EmployeeWorkShotControllers
    .getMyWorkShots,
);


// ==========================================
// ADMIN / PROJECT MANAGER
// ==========================================

router.get(
  "/work/:workDetailId",

  isUserLoggedIn,

  accessToRoles(
    UserRole.Admin,
    UserRole.ProjectManager,
  ),

  EmployeeWorkShotControllers
    .getWorkShotsByWorkDetail,
);


// ==========================================
// GET SINGLE WORK SHOT
// ==========================================

router.get(
  "/:id",

  isUserLoggedIn,

  accessToRoles(
    UserRole.Admin,
    UserRole.ProjectManager,
    UserRole.Employee,
  ),

  EmployeeWorkShotControllers
    .getWorkShotById,
);


// ==========================================
// DELETE WORK SHOT
// ==========================================

router.delete(
  "/:id",

  isUserLoggedIn,

  accessToRoles(
    UserRole.Admin,
  ),

  EmployeeWorkShotControllers
    .deleteWorkShot,
);


export default router;