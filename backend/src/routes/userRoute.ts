import express, { Request, Response } from "express"
import passport from "../config/googleConfig"
import UserController from "../controller/userControllers"
import errorHandler from "../utils/errorHandler"
import { envConfig } from "../config/config"
import { IExtendedRequest } from "../globals/types"
import { accessToRoles, isUserLoggedIn } from "../middlewares/UserMiddleware"
import { UserRole } from "../globals/types"
const router = express.Router()

//register
router.post("/register", errorHandler(UserController.register))

//login
router.post("/login", errorHandler(UserController.login))

// GOOGLE LOGIN
router.get(
    "/google",
    passport.authenticate(
        "google",
        {
            scope: [
                "profile",
                "email"
            ]
        }
    )
)

// GOOGLE CALLBACK
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    session: false, 
    failureRedirect: `${envConfig.clientUrl}/login?error=google_auth_failed` 
  }),
(req, res, next) => {
    UserController.googleLoginSuccess(req as IExtendedRequest, res)
      .catch((error) => next(error)); // Catches async errors and sends them to errorHandler
  }
);

// refresh token
router.post("/refresh",errorHandler(UserController.refreshAccessToken))

//logout 
router.post("/logout", errorHandler(UserController.logout))

// get user account details in profile
router.get("/me", errorHandler(isUserLoggedIn) , errorHandler( UserController.getMyAccountDetails))

// list users for admin dashboards, assignments, and chat peers
router.get(
  "/users",
  errorHandler(isUserLoggedIn),
  errorHandler(UserController.getUsers),
)

// activate/deactivate user by admin
router.patch(
  "/users/:userId/status",
  errorHandler(isUserLoggedIn),
  accessToRoles(UserRole.Admin),
  errorHandler(UserController.updateUserStatus),
)

//add employee details
router.post("/add-employee-details/:userId", errorHandler(isUserLoggedIn), errorHandler(UserController.addEmployeeDetails))

//update role to employee by admin
router.post("/update-role-to-employee/:userId", errorHandler(isUserLoggedIn), accessToRoles(UserRole.Admin), errorHandler(UserController.updateRoleToEmployee))

//update role to employee by admin
router.post("/update-role-to-project-manager/:userId", errorHandler(isUserLoggedIn), accessToRoles(UserRole.Admin), errorHandler(UserController.updateRoleToProjectManager))

export default router

