
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import maintenanceMiddleware from "./middlewares/maintenanceMiddleware";
import userRoutes from "./routes/userRoute";
import projectRoutes from "./routes/projectRoutes";
import shotRoutes from "./routes/shotRoutes";
import projectAssignedRoutes from "./routes/projectAssignedRoutes";
import shotAssignedRoutes from "./routes/shotAssignedRoutes";
import shotSubmissionRoutes from "./routes/shotSubmissionRoutes";
import shotReviewRoutes from "./routes/shotReviewRoutes";
import conversationRoutes from "./routes/conversationRoutes";
import messageRoutes from "./routes/messageRoutes";
import notificationRoutes from "./routes/notificationRoute";
import employeeWorkDetailRoutes from "./routes/employeeWorkDetailRoute";
import employeeWorkShotRoutes from "./routes/employeeWorkShotRoute";

const app = express();

// ==========================================
// BASIC SECURITY
// ==========================================

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);


// ==========================================
// RATE LIMIT
// ==========================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// =====================================================
// CORS
// =====================================================

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL].filter(Boolean) as string[]
    : [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(maintenanceMiddleware);
app.use(cookieParser());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "Task Management API is running",
  });
});


// =====================================================
// AUTH
// =====================================================

app.use(
  "/api/auth",
  userRoutes,
);


// =====================================================
// PROJECTS
// =====================================================

app.use(
  "/api/projects",
  projectRoutes,
);


// =====================================================
// PROJECT ASSIGNMENTS
// =====================================================

app.use(
  "/api/projects-assign",
  projectAssignedRoutes,
);


// =====================================================
// SHOTS
// =====================================================

app.use(
  "/api/shots",
  shotRoutes,
);


// =====================================================
// SHOT ASSIGNMENTS
// =====================================================

app.use(
  "/api/shot-assigned",
  shotAssignedRoutes,
);


// =====================================================
// SHOT SUBMISSIONS
// =====================================================

app.use(
  "/api/shot-submission",
  shotSubmissionRoutes,
);


// =====================================================
// SHOT REVIEWS
// =====================================================

app.use(
  "/api/shots-review",
  shotReviewRoutes,
);


// =====================================================
// EMPLOYEE WORK DETAILS
// =====================================================

app.use(
  "/api/employee-work-details",
  employeeWorkDetailRoutes,
);

// =====================================================
// EMPLOYEE WORK SHOTS
// =====================================================

app.use(
  "/api/employee-work-shots",
  employeeWorkShotRoutes,
);

// =====================================================
// NOTIFICATIONS
// =====================================================

app.use(
  "/api/notifications",
  notificationRoutes,
);


// =====================================================
// CONVERSATIONS
// =====================================================

app.use(
  "/api/conversations",
  conversationRoutes,
);


// =====================================================
// MESSAGES
// =====================================================

app.use(
  "/api/messages",
  messageRoutes,
);


export default app;
