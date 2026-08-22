export type SubmissionStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "redo_required";

export interface SubmissionFile {
  id: string;
  submissionId: string;
  fileType: "video" | "projectFile";
  driveFileId: string;
  driveFileUrl: string | null;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShotSubmission {
  id: string;
  shotId: string;
  submittedBy: string;
  version: number;
  videoLength: number | null;
  status: SubmissionStatus;
  files?: SubmissionFile[];
  SubmissionFiles?: SubmissionFile[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewPayload {
  comment?: string;
}
