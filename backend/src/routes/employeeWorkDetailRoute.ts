import express from "express";

import {
  accessToRoles,
  isUserLoggedIn,
} from "../middlewares/UserMiddleware";

import {
  UserRole,
} from "../globals/types";

import EmployeeWorkDetailControllers
  from "../controller/employeeWorkDetailControllers";


const router = express.Router();


// =====================================================
// EMPLOYEE ROUTES
// =====================================================

// Get all my work details
//
// Optional:
// ?year=2026&month=8

router.get(
  "/my",
  isUserLoggedIn,
  accessToRoles(UserRole.Employee),
  EmployeeWorkDetailControllers.getMyWorkDetails,
);


// Get my work details for a particular month
//
// /my/2026/8

router.get(
  "/my/:year/:month",
  isUserLoggedIn,
  accessToRoles(UserRole.Employee),
  EmployeeWorkDetailControllers.getMyMonthlyWorkDetails,
);


// =====================================================
// ADMIN ROUTES
// =====================================================

// Get all employee work details
//
// Optional:
// ?year=2026&month=8

router.get(
  "/admin/all",
  isUserLoggedIn,
  accessToRoles(UserRole.Admin),
  EmployeeWorkDetailControllers.getAllEmployeeWorkDetails,
);


// Get particular employee's work history

router.get(
  "/admin/employee/:employeeId",
  isUserLoggedIn,
  accessToRoles(UserRole.Admin),
  EmployeeWorkDetailControllers.getEmployeeWorkDetails,
);


// Get particular employee's work for a particular month

router.get(
  "/admin/employee/:employeeId/:year/:month",
  isUserLoggedIn,
  accessToRoles(UserRole.Admin),
  EmployeeWorkDetailControllers.getEmployeeMonthlyWorkDetails,
);


// Update salary status

router.patch(
  "/admin/:workDetailId/salary-status",
  isUserLoggedIn,
  accessToRoles(UserRole.Admin),
  EmployeeWorkDetailControllers.updateSalaryStatus,
);


// Get unpaid work details

router.get(
  "/admin/unpaid",
  isUserLoggedIn,
  accessToRoles(UserRole.Admin),
  EmployeeWorkDetailControllers.getUnpaidWorkDetails,
);


export default router;