
import jwt from "jsonwebtoken";
import User from "../database/models/userModel";
import { NextFunction, Request, Response } from "express";
import { IExtendedRequest } from "../globals/types";

interface JwtPayload {
  userId: string;
}



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
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as JwtPayload;

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
    if (error instanceof jwt.TokenExpiredError) {
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
      return res.status(432).json({
        message: "Forbidden: You do not have permission to access this resource",
      });
    }

    next();
  };
};