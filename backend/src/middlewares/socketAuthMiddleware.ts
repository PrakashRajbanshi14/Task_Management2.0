import jwt from "jsonwebtoken";

import { Socket } from "socket.io";

import User from "../database/models/userModel";

interface JwtPayload {
  userId: string;
}

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    // ==========================================
    // Get cookies
    // ==========================================

    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      return next(new Error("Authentication required"));
    }

    // ==========================================
    // Extract accessToken
    // ==========================================

    const cookies = cookieHeader.split(";").reduce(
      (acc: Record<string, string>, cookie) => {
        const [key, ...valueParts] = cookie.trim().split("=");

        acc[key] = decodeURIComponent(valueParts.join("="));

        return acc;
      },

      {},
    );

    const token = cookies.accessToken;

    if (!token) {
      return next(new Error("Access token required"));
    }

    // ==========================================
    // Verify JWT
    // ==========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as JwtPayload;

    // ==========================================
    // Find user
    // ==========================================

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return next(new Error("User not found"));
    }

    if (!user.isActive) {
      return next(new Error("Account is inactive"));
    }

    // ==========================================
    // Attach user
    // ==========================================

    socket.data.user = user;

    next();
  } catch (error) {
    console.error("Socket Authentication Error:", error);

    next(new Error("Invalid authentication"));
  }
};
