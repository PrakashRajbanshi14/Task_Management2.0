export type NotificationType =
  | "shot_assigned"
  | "shot_submitted"
  | "submission_approved"
  | "submission_redo"
  | "project_assigned"
  | "message";

export interface Notification {
  id: string;
  senderId: string;
  receiverId: string;
  title: string;
  message: string;
  type: NotificationType;
  url: string | null;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}
