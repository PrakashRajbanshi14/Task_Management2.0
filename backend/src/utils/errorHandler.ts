import {
  NextFunction,
  Request,
  Response,
} from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

const errorHandler = (fn: AsyncRouteHandler) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    Promise.resolve(fn(req, res, next)).catch(
      (err: Error) => {
        res.status(500).json({
          message: "Internal Error!",
          errorMessage: err.message,
        });
      },
    );
  };
};

export default errorHandler;
