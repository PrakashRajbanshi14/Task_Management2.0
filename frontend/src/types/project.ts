export type ProjectStatus =
  | "planned"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  projectManagerId: string;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  googleDriveFolderId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectPayload {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
}

export interface ProjectAssignmentPayload {
  employeeIds: string[];
}
