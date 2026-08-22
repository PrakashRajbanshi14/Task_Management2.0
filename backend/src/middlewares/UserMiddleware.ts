
import User from "../database/models/userModel";
import { NextFunction, Request, Response } from "express";
import { IExtendedRequest } from "../globals/types";
import {
  generateAccessToken,
  verifyAccessToken,
} from "../utils/generateToken";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/config";
import {
  accessTokenCookieOptions,
  authCookieClearOptions,
} from "../config/cookieConfig";


type RefreshAuthResult =
  | "authenticated"
  | "failed"
  | "handled";

const refreshRequestAuthentication = async (
  req: IExtendedRequest,
  res: Response,
): Promise<RefreshAuthResult> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return "failed";
    }

    const decoded = jwt.verify(
      refreshToken,
      envConfig.jwtRefreshSecretKey as string,
    ) as {
      userId: string;
    };

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return "failed";
    }

    if (!user.isActive) {
      res.status(403).json({
        message: "Your account is inactive",
      });
      return "handled";
    }

    const newAccessToken = generateAccessToken(user.id);

    res.clearCookie("accessToken", authCookieClearOptions);
    res.cookie("accessToken", newAccessToken, accessTokenCookieOptions);

    req.user = user as User;

    return "authenticated";
  } catch (error) {
    return "failed";
  }
};

/**
 * Middleware to verify if the user is authenticated via Access Token
 */
export const isUserLoggedIn = async (
  req: IExtendedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      const refreshResult =
        await refreshRequestAuthentication(req, res);

      if (refreshResult === "authenticated") {
        return next();
      }

      if (refreshResult === "handled") {
        return;
      }

      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const decoded = verifyAccessToken(token);

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

    // Attach user instance to the request object
    req.user = user as User;

    next();
  } catch (error) {
    const refreshResult =
      await refreshRequestAuthentication(req, res);

    if (refreshResult === "authenticated") {
      return next();
    }

    if (refreshResult === "handled") {
      return;
    }

    if (error instanceof Error && error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access token expired",
      });
    }

    return res.status(401).json({
      message: "Invalid authentication token",
    });
  }
};

/**
 * Middleware factory to restrict access based on user roles
 * @param allowedRoles Array of strings representing acceptable roles (e.g., ['admin', 'manager'])
 */
export const accessToRoles = (...allowedRoles: string[]) => {
  return (req: IExtendedRequest, res: Response, next: NextFunction) => {
    // Ensure isUserLoggedIn ran before this middleware
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Adjust 'req.user.role' to match your actual database column name (e.g., user_role, roleId)
    const userRole = req.user.role; 

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to access this resource",
      });
    }

    next();
  };
};
