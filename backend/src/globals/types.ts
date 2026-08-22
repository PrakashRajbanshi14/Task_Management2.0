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
    created = "Created",
    assigned = "Assigned",
    submitted = "Submitted",
    approved = "Approved",
    redo = "Redo",
    completed = "Completed"
}

export enum SubmissionStatus {
    submitted = "submitted",
    underReview = "under_review",
    approved = "approved",
    redoRequired = "redo_required"
}

export enum SubmissionFileType {
  video = "video",
  projectFile = "projectFile",
}


export enum ReviewStatus {
    approved = "approved",
    redoRequired = "redo_required"
}

export enum NotificationType {
  shotAssigned = "shot_assigned",
  shotSubmitted = "shot_submitted",
  submissionApproved = "submission_approved",
  submissionRedo = "submission_redo",
  projectAssigned = "project_assigned",
  message = "message",
}

export enum SalaryStatus {
  Unpaid = "unpaid",
  Paid = "paid",
}

export enum MessageType {
  text = "text",
  audioCall = "audio_call",
  videoCall = "video_call",
  screenShare = "screen_share",
}

export enum CallStatus {
  calling = "calling",
  accepted = "accepted",
  rejected = "rejected",
  missed = "missed",
  ended = "ended",
}