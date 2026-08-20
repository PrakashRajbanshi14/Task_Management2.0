import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoute";
import projectRoutes from "./routes/projectRoutes"
import shotRoutes from "./routes/shotRoutes"
import projectAssignedRoutes from "./routes/projectAssignedRoutes"
import shotAssignedRoutes from "./routes/shotAssignedRoutes"
import shotSubmissionRoutes from "./routes/shotSubmissionRoutes"
// import shotReviewRoutes from "./routes/shotReviewRoutes"
// import conversationRoutes from "./routes/conversationRoutes"
import notificationRoutes from "./routes/notificationRoute";
import cookieParser from "cookie-parser"
const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        message: "Task Management API is running"
    });
});

app.use("/api/auth",userRoutes)
app.use("/api/projects",projectRoutes)
app.use("/api/projects-assign",projectAssignedRoutes)
app.use("/api/shots",shotRoutes)
app.use("/api/shot-assigned",shotAssignedRoutes)
app.use("/api/shot-submission",shotSubmissionRoutes)
app.use("/api/notifications", notificationRoutes)
// app.use("/api/shots",shotReviewRoutes)
// app.use("/api/conversations",conversationRoutes)

export default app;
