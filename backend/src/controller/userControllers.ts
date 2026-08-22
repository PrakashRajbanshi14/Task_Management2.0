import { Request, Response } from "express";
import { IExtendedRequest, UserRole } from "../globals/types";
import User from "../database/models/userModel";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  authCookieClearOptions,
} from "../config/cookieConfig";
import { envConfig } from "../config/config";
import { sendResponse } from "../utils/sendResponse";
import jwt from "jsonwebtoken";
import Employee from "../database/models/employeeModel";
import generateRandomEmployeeCode from "../utils/generateEmployeeCode";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";

const setAuthenticationCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.clearCookie("accessToken", authCookieClearOptions);
  res.clearCookie("refreshToken", authCookieClearOptions);
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
};

class UserController {

  // REGISTER using form
  static async register(req: Request, res: Response) {
    try {
      const { userName, email, password, fullName } = req.body;

      // -----------------------------------------------
      // Validation
      // -----------------------------------------------

      if (!userName || !email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: "userName, email, password and fullName are required",
        });
      }

      // -----------------------------------------------
      // Check existing email
      // -----------------------------------------------

      const existingEmail = await User.findOne({
        where: {
          email,
        },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      // -----------------------------------------------
      // Check username
      // -----------------------------------------------

      const existingUsername = await User.findOne({
        where: {
          userName,
        },
      });

      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }

      // -----------------------------------------------
      // Hash password
      // -----------------------------------------------

      const hashedPassword = await bcrypt.hash(password, 12);

      // -----------------------------------------------
      // Create user
      // -----------------------------------------------

      const user = await User.create({
        userName,

        email,

        password: hashedPassword,

        googleId: null,

        fullName,

        profileImage: null,

        role: UserRole.User,

        isActive: true,
      });

      return res.status(201).json({
        success: true,

        message: "Registration successful",

        data: {
          id: user.id,

          userName: user.userName,

          email: user.email,

          fullName: user.fullName,

          role: user.role,
        },
      });
    } catch (error) {
      console.error("Register Error:", error);

      return res.status(500).json({
        success: false,

        message: "Internal server error",
      });
    }
  }

  // LOGIN using form
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // -----------------------------------------------
      // Validation
      // -----------------------------------------------

      if (!email || !password) {
        return res.status(400).json({
          success: false,

          message: "Email and password are required",
        });
      }

      // -----------------------------------------------
      // Find user
      // -----------------------------------------------

      const user = await User.findOne({
        where: {
          email,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,

          message: "Invalid email or password",
        });
      }

      // -----------------------------------------------
      // Check active status
      // -----------------------------------------------

      if (!user.isActive) {
        return res.status(403).json({
          success: false,

          message: "Your account is inactive",
        });
      }

      // -----------------------------------------------
      // Google-only account
      // -----------------------------------------------

      if (!user.password) {
        return res.status(400).json({
          success: false,

          message:
            "This account uses Google login. Please continue with Google.",
        });
      }

      // -----------------------------------------------
      // Compare password
      // -----------------------------------------------

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,

          message: "Invalid email or password",
        });
      }

      // -----------------------------------------------
      // Generate tokens
      // -----------------------------------------------

      const accessToken = generateAccessToken(user.id);

      const refreshToken = generateRefreshToken(user.id);

      // -----------------------------------------------
      // Set cookies
      // -----------------------------------------------

      setAuthenticationCookies(res, accessToken, refreshToken);

      // -----------------------------------------------
      // Response
      // -----------------------------------------------

      return res.status(200).json({
        success: true,

        message: "Login successful",

        data: {
          user: {
            id: user.id,

            userName: user.userName,

            email: user.email,

            fullName: user.fullName,

            profileImage: user.profileImage,

            role: user.role,
          },
        },
      });
    } catch (error) {
      console.error("Login Error:", error);

      return res.status(500).json({
        success: false,

        message: "Internal server error",
      });
    }
  }

  //google Login
  static async googleLoginSuccess(req: IExtendedRequest, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.redirect(
          `${envConfig.clientUrl}/login?error=google_auth_failed`,
        );
      }
      //check account status
      if (!user.isActive) {
        return res.redirect(
          `${envConfig.clientUrl}/login?error=account_inactive`,
        );
      }
      // generate jwt
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Set Access Token Cookie
      setAuthenticationCookies(res, accessToken, refreshToken);

      // Redirect to React
      return res.redirect(`${envConfig.clientUrl}/auth/success`);
    } catch (error) {
      console.error("Google Login Error:", error);
      return res.redirect(
        `${envConfig.clientUrl}/login?error=google_auth_failed`,
      );
    }
  }

  //submit employee details
  static async addEmployeeDetails(req: IExtendedRequest, res: Response) {
    const { fullname, contact, address, jobTitle } = req.body;
    const { userId } = req.params;
    const user = req.user;
    if (!userId) {
      return sendResponse(res, 401, "NO userId found!");
    }
    if (!contact || !address || !fullname || !jobTitle) {
      return sendResponse(res, 401, "Some Fields are missing!");
    }
    if (!user) {
      return sendResponse(res, 401, "Authentication required");
    }

    //if it is not his account
    if (user.id !== userId) {
      return sendResponse(
        res,
        403,
        "You are not authorized to update this profile",
      );
    }

    const existingEmployee = await Employee.findOne({
      where: {
        userId: user.id,
      },
    });

    if (existingEmployee) {
      await existingEmployee.update({
        fullname,
        contact,
        address,
        jobTitle,
      });
    } else {
      await Employee.create({
        fullname,
        contact,
        address,
        jobTitle,
        employeeCode: generateRandomEmployeeCode(),
        hasWork: false,
        userId: user.id,
      });
    }

    await User.update(
      {
        fullName: fullname,
      },
      {
        where: {
          id: user.id,
        },
      },
    );

    const updatedUser = await User.findByPk(user.id);
    const employeeData = await Employee.findOne({
      where: {
        userId: user.id,
      },
    });

    return sendResponse(
      res,
      200,
      "Employee Info added successfully",
      {
        id: updatedUser?.id,
        userName: updatedUser?.userName,
        email: updatedUser?.email,
        fullName: updatedUser?.fullName,
        profileImage: updatedUser?.profileImage,
        role: updatedUser?.role,
        isActive: updatedUser?.isActive,
        employee: employeeData,
      },
    );
  }

  //update role to employee
  static async updateRoleToEmployee(req: IExtendedRequest, res: Response) {
    const { userId } = req.params;
    const user = req.user;
    if (!user) {
      return sendResponse(res, 401, "Please Logged in to continue!");
    }
    if (!userId) {
      return sendResponse(res, 401, "NO userId found!");
    }
    if (user.role === UserRole.Admin) {
      await User.update(
        {
          role: UserRole.Employee,
        },
        { where: { id: userId } },
      );
    }
    sendResponse(res, 200, "User role updated to Employee Successfully!");
  }

  // get user profile account details
  static async getMyAccountDetails(req: IExtendedRequest, res: Response) {
    const user = req.user;
    if (!user) {
      return sendResponse(res, 401, "Authentication required", user);
    }
    const employeeData = await Employee.findOne({
      where: { userId: user.id },
    });
    return sendResponse(res, 200, "User retrieved successfully", {
      id: user.id,
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
      profileImage: user.profileImage,
      role: user.role,
      isActive: user.isActive,
      employee: employeeData,
    });
  }

  // get users for admin management, chat, and assignment pickers
  static async getUsers(req: IExtendedRequest, res: Response) {
    const user = req.user;

    if (!user) {
      return sendResponse(res, 401, "Authentication required");
    }

    const requestedRoles = String(req.query.roles || "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean) as UserRole[];

    let allowedRoles: UserRole[] = [];

    if (user.role === UserRole.Admin) {
      allowedRoles = [
        UserRole.Admin,
        UserRole.ProjectManager,
        UserRole.Employee,
        UserRole.User,
      ];
    } else if (user.role === UserRole.ProjectManager) {
      allowedRoles = [UserRole.Admin, UserRole.Employee];
    } else if (user.role === UserRole.Employee) {
      allowedRoles = [UserRole.Admin, UserRole.ProjectManager];
    } else {
      return sendResponse(res, 403, "You are not allowed to list users");
    }

    const roles =
      requestedRoles.length > 0
        ? requestedRoles.filter((role) => allowedRoles.includes(role))
        : allowedRoles;

    const users = await User.findAll({
      where: {
        id: {
          [Op.ne]: user.id,
        },
        role: {
          [Op.in]: roles,
        },
      },
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: Employee,
          as: "employee",
          required: false,
        },
      ],
      order: [
        ["role", "ASC"],
        ["fullName", "ASC"],
      ],
    });

    return sendResponse(
      res,
      200,
      "Users fetched successfully",
      users,
    );
  }

  // update user active status
  static async updateUserStatus(req: IExtendedRequest, res: Response) {
    const user = req.user;
    const { userId } = req.params;
    const { isActive } = req.body;

    if (!user) {
      return sendResponse(res, 401, "Please login to continue!");
    }

    if (user.role !== UserRole.Admin) {
      return sendResponse(res, 403, "Only admins can update user status");
    }

    if (!userId || typeof isActive !== "boolean") {
      return sendResponse(res, 400, "User ID and isActive are required");
    }

    await User.update(
      {
        isActive,
      },
      {
        where: {
          id: userId,
        },
      },
    );

    return sendResponse(
      res,
      200,
      isActive ? "User activated successfully" : "User deactivated successfully",
    );
  }

  //update role to project manager
  static async updateRoleToProjectManager(
    req: IExtendedRequest,
    res: Response,
  ) {
    const { userId } = req.params;
    const user = req.user;
    if (!user) {
      return sendResponse(res, 401, "Please Logged in to continue!");
    }
    if (!userId) {
      return sendResponse(res, 401, "NO userId found!");
    }
    if (user.role === UserRole.Admin) {
      await User.update(
        {
          role: UserRole.ProjectManager,
        },
        { where: { id: userId } },
      );
    }
    sendResponse(res, 200, "User role updated to Employee Successfully!");
  }

  // REFRESH ACCESS TOKEN
  static async refreshAccessToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          message: "Refresh token not found",
        });
      }

      const decoded = jwt.verify(
        refreshToken,
        envConfig.jwtRefreshSecretKey as string,
      ) as {
        userId: string;
      };

      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message: "Your account is inactive",
        });
      }

      const newAccessToken = generateAccessToken(user.id);

      res.clearCookie("accessToken", authCookieClearOptions);
      res.cookie("accessToken", newAccessToken, accessTokenCookieOptions);

      return res.status(200).json({
        message: "Access token refreshed successfully",
      });
    } catch (error) {
      console.error("Refresh Token Error:", error);

      return res.status(401).json({
        message: "Invalid or expired refresh token",
      });
    }
  }

  // LOGOUT
  static async logout(req: Request, res: Response) {
    try {
      res.clearCookie("accessToken", authCookieClearOptions);
      res.clearCookie("refreshToken", authCookieClearOptions);
      return sendResponse(res, 200, "Logout successful");
    } catch (error) {
      console.error("Logout Error:", error);
      return sendResponse(res, 500, "Internal server error");
    }
  }
}

export default UserController;
