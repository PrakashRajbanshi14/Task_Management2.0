import express from "express"

import authMiddleware
    from "../middlewares/authMiddleware"

import accessTo
    from "../middlewares/roleMiddleware"

import { UserRole } from "../globals/types"
import shotAssignedController from "../controllers/shotAssignedController"


const router = express.Router()


// ==========================================
// ASSIGN EMPLOYEE TO SHOT
// ==========================================

router.post(

    "/:shotId/employees",

    authMiddleware,

    accessTo(
        UserRole.ProjectManager,
        UserRole.Admin
    ),

    (req, res) => shotAssignedController.assignEmployeeToShot(req as any, res)

)


// ==========================================
// GET ASSIGNMENT OF SHOT
// ==========================================

router.get(

    "/:shotId/assignment",

    authMiddleware,

    shotAssignedController.getShotAssignment

)


// ==========================================
// GET ALL SHOTS ASSIGNED TO EMPLOYEE
// ==========================================

router.get(

    "/employees/:employeeId/assignments",

    authMiddleware,

    shotAssignedController.getEmployeeShotAssignments

)


// ==========================================
// REMOVE EMPLOYEE FROM SHOT
// ==========================================

router.delete(

    "/:shotId/assignments/:assignmentId",

    authMiddleware,

    accessTo(
        UserRole.ProjectManager,
        UserRole.Admin
    ),

    shotAssignedController.removeEmployeeFromShot

)


export default router
