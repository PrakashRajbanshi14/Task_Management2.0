import { Request } from "express"

declare global {
  namespace Express {
    interface User {
      id: string;
      userName: string;
      email: string;
      password: string | null;
      googleId: string | null;
      fullName: string;
      profileImage: string | null;
      role: UserRole;
      isActive: boolean;
    }
  }
}

export interface IExtendedRequest extends Request {}

export enum UserRole {
    Admin = "admin",
    ProjectManager = "projectManager",
    Employee = "employee",
    User = "user"
}

export enum ProjectStatus {
    planned = "planned",
    active = "active",
    onHold = "on_hold",
    completed = "completed",
    cancelled = "cancelled"
}


export enum ProjectPriority {
    low = "low",
    medium = "medium",
    high = "high",
    urgent = "urgent"
}

export enum ShotStatus {
    created = "created",
    assigned = "assigned",
    inProgress = "in_progress",
    submitted = "submitted",
    completed = "completed"
}

export enum SubmissionStatus {
    submitted = "submitted",
    underReview = "under_review",
    approved = "approved",
    redoRequired = "redo_required"
}

export enum ReviewStatus {
    approved = "approved",
    redoRequired = "redo_required"
}