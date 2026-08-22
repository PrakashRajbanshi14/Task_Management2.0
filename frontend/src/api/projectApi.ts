import api from "./axios";
import type {
  Project,
  ProjectAssignmentPayload,
  ProjectPayload,
} from "../types/project";
import type { Employee, ProjectAssignment } from "../types/employee";
import type { ApiResponse } from "../utils/api";

export const getProjects = async () => {
  const response = await api.get<ApiResponse<Project[]>>("/projects");
  return response.data;
};

export const getProject = async (projectId: string) => {
  const response = await api.get<ApiResponse<Project>>(`/projects/${projectId}`);
  return response.data;
};

export const createProject = async (payload: ProjectPayload) => {
  const response = await api.post<ApiResponse<Project>>("/projects", payload);
  return response.data;
};

export const updateProject = async (
  projectId: string,
  payload: ProjectPayload,
) => {
  const response = await api.patch<ApiResponse<Project>>(
    `/projects/${projectId}`,
    payload,
  );
  return response.data;
};

export const deleteProject = async (projectId: string) => {
  const response = await api.delete<ApiResponse>(`/projects/${projectId}`);
  return response.data;
};

export const assignEmployeesToProject = async (
  projectId: string,
  payload: ProjectAssignmentPayload,
) => {
  const response = await api.post<ApiResponse<ProjectAssignment[]>>(
    `/projects-assign/${projectId}/employees`,
    payload,
  );
  return response.data;
};

export const getProjectEmployees = async (projectId: string) => {
  const response = await api.get<ApiResponse<Employee[]>>(
    `/projects-assign/${projectId}/employees`,
  );
  return response.data;
};

export const getEmployeeProjects = async (employeeId: string) => {
  const response = await api.get<ApiResponse<ProjectAssignment[]>>(
    `/projects-assign/employees/${employeeId}/projects`,
  );
  return response.data;
};

export const removeEmployeeFromProject = async (
  projectId: string,
  employeeId: string,
) => {
  const response = await api.delete<ApiResponse>(
    `/projects-assign/${projectId}/employee/${employeeId}`,
  );
  return response.data;
};
