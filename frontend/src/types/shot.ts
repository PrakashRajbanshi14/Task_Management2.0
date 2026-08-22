export type ShotStatus =
  | "Created"
  | "Assigned"
  | "Submitted"
  | "Approved"
  | "Redo"
  | "Completed";

export interface Shot {
  id: string;
  projectId: string;
  shotNumber: number;
  title: string;
  script: string | null;
  deadline: string | null;
  status: ShotStatus;
  createdBy: string;
  googleDriveFolderId?: string | null;
  underReviewFolderId?: string | null;
  finalVideoFolderId?: string | null;
  projectFilesFolderId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShotPayload {
  shotNumber: number;
  title: string;
  script?: string;
  deadline?: string;
}

export interface ShotAssignment {
  id: string;
  shotId: string;
  employeeId: string;
  status: string;
  assignedBy: string;
  shot?: Shot;
  ProjectShot?: Shot;
  createdAt?: string;
  updatedAt?: string;
}
