import { NotificationType, ProjectPriority, ProjectStatus, ReviewStatus, ShotStatus, SubmissionFileType, SubmissionStatus, UserRole } from "../../globals/types"

export interface UserAttributes {
    id: string
    userName: string
    email: string,
    password: string | null
    googleId: string | null
    fullName: string
    profileImage: string | null
    role: UserRole
    isActive: boolean
}

export interface EmployeeAttributes {
    id: string
    fullname: string
    contact: string
    address: string
    userId: string
    employeeCode: string
    jobTitle: string | null,
    hasWork: boolean
}

export interface ProjectAttributes {
    id: string
    name: string
    description: string | null
    projectManagerId: string
    startDate: Date | null
    endDate: Date | null
    status: ProjectStatus
    priority: ProjectPriority
    googleDriveFolderId: string | null
}

export interface ProjectAssignedAttributes {
    id: string
    projectId: string
    employeeId: string
    assignedBy: string
}

export interface ProjectShotAttributes {
    id: string
    projectId: string,
    googleDriveFolderId: string | null
    underReviewFolderId: string | null
    finalVideoFolderId: string | null
    projectFilesFolderId: string | null
    shotNumber: number
    title: string
    script: string | null
    deadline: Date | null
    status: ShotStatus
    createdBy: string
}

export interface ShotAssignedAttributes {
    id: string
    shotId: string
    employeeId: string
    assignedBy: string
}

export interface ShotSubmissionAttributes {
    id: string
    shotId: string
    submittedBy: string
    version: number
    mimeType: string
    driveFileId: string
    driveFileUrl: string | null
    fileName: string
    fileSize: number | null
    fileType : SubmissionFileType
    status: SubmissionStatus
}

export interface ShotReviewAttributes {
    id: string
    shotId: string
    submissionId: string
    reviewedBy: string
    status: ReviewStatus
    feedback: string | null
}

export interface ConversationAttributes {
    id: string
    projectManagerId: string
    employeeId: string
    projectId: string
}

export interface MessageAttributes {
    id: string
    conversationId: string
    senderId: string
    message: string
    isRead: boolean
    readAt: Date | null
}

export interface NotificationAttributes {
  id: string;
  senderId: string;
  receiverId: string;
  title: string;
  message: string;
  type: NotificationType;
  url: string | null;
  isRead: boolean;
}