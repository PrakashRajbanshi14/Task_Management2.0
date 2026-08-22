import jwt, { SignOptions } from "jsonwebtoken";
import { envConfig } from "../config/config";
import { StringValue } from "ms";

export const generateAccessToken = (userId: string) => {
  const options: SignOptions = {
    expiresIn: envConfig.accessSecretExpiresIn as StringValue,
  };
  return jwt.sign(
    {
      userId,
    },
    envConfig.jwtAccessSecretKey,
    options,
  );
};

export const generateRefreshToken = (userId: string) => {
  const options: SignOptions = {
    expiresIn: envConfig.refreshSecretExpiresIn as StringValue,
  };
  return jwt.sign(
    {
      userId,
    },
    envConfig.jwtRefreshSecretKey,
    options,
  );
};

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, envConfig.jwtAccessSecretKey) as { userId: string };
