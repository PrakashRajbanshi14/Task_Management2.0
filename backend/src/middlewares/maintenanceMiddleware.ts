import { Request, Response, NextFunction } from "express";

const maintenanceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {

  const maintenanceMode =
    process.env.MAINTENANCE_MODE === "true";

  // System is running normally
  if (!maintenanceMode) {
    return next();
  }

  // Allow health/root endpoint if you want
  if (req.path === "/") {
    return next();
  }

  return res.status(503).json({
    success: false,
    message:
      "System is currently under maintenance. Please try again later.",
  });
};

export default maintenanceMiddleware;