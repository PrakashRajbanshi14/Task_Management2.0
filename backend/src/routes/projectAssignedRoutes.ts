import express from "express"

import authMiddleware
    from "../middlewares/authMiddleware"

import accessTo
    from "../middlewares/roleMiddleware"

import { UserRole } from "../globals/types"
import projectAssignedController from "../controllers/projectAssignedController"


const router = express.Router()


// ==========================================
// ASSIGN EMPLOYEE TO PROJECT
// ==========================================

router.post(

    "/:projectId/employees",

    authMiddleware,

    accessTo(
        UserRole.ProjectManager,
        UserRole.Admin
    ),

    (req, res) => projectAssignedController.assignEmployeeToProject(req as any, res)

)


// ==========================================
// GET ALL EMPLOYEES OF PROJECT
// ==========================================

router.get(

    "/:projectId/employees",

    authMiddleware,

    projectAssignedController.getProjectEmployees

)


// ==========================================
// GET ALL PROJECTS OF EMPLOYEE
// ==========================================

router.get(

    "/employees/:employeeId/projects",

    authMiddleware,

    projectAssignedController.getEmployeeProjects

)


// ==========================================
// REMOVE EMPLOYEE FROM PROJECT
// ==========================================

router.delete(

    "/:projectId/assignments/:assignmentId",

    authMiddleware,

    accessTo(
        UserRole.ProjectManager,
        UserRole.Admin
    ),

    projectAssignedController.removeEmployeeFromProject

)


export default router
