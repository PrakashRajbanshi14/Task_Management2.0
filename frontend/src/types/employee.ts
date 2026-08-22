import type { User } from "./auth";
import type { Project } from "./project";
import type { Shot } from "./shot";

export interface Employee {
  id: string;
  userId: string;
  fullname: string;
  fullName?: string;
  contact: string;
  address: string;
  employeeCode: string;
  jobTitle: string;
  hasWork: boolean;
  user?: User;
  User?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  employeeId: string;
  assignedBy: string;
  project?: Project;
  Project?: Project;
  employee?: Employee;
  Employee?: Employee;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeWorkDetail {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  totalVideoLength: number;
  salaryStatus: "paid" | "unpaid";
  salaryAmount: number | null;
  notes: string | null;
  employee?: Employee;
  Employee?: Employee;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeWorkShot {
  id: string;
  workDetailId: string;
  projectId: string;
  shotId: string;
  videoLength: number;
  project?: Project;
  Project?: Project;
  shot?: Shot;
  ProjectShot?: Shot;
  createdAt?: string;
  updatedAt?: string;
}
