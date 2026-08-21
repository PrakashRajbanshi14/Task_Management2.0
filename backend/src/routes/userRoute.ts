import express, { Request, Response } from "express"
import passport from "../config/googleConfig"
import UserController from "../controller/userControllers"
import errorHandler from "../utils/errorHandler"
import { envConfig } from "../config/config"
import { IExtendedRequest } from "../globals/types"
import { isUserLoggedIn } from "../middlewares/UserMiddleware"
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
router.post("/logout", errorHandler(UserController))

// get user account details in profile
router.get("/me", errorHandler(isUserLoggedIn) , errorHandler( UserController.getMyAccountDetails))

//add employee details
router.post("/add-employee-details", errorHandler(UserController.addEmployeeDetails))

//update role to employee by admin
router.post("/update-role-to-employee", errorHandler(UserController.updateRoleToEmployee))

//update role to employee by admin
router.post("/update-role-to-project-manager", errorHandler(UserController.updateRoleToProjectManager))

export default router

