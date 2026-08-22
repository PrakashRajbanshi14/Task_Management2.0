import api from "./axios";
import type { Shot, ShotAssignment, ShotPayload } from "../types/shot";
import type { ApiResponse } from "../utils/api";

export const getProjectShots = async (projectId: string) => {
  const response = await api.get<ApiResponse<Shot[]>>(
    `/shots/projects/${projectId}/shots`,
  );
  return response.data;
};

export const createShot = async (projectId: string, payload: ShotPayload) => {
  const response = await api.post<ApiResponse<Shot>>(
    `/shots/projects/${projectId}/shots`,
    payload,
  );
  return response.data;
};

export const getShot = async (shotId: string) => {
  const response = await api.get<ApiResponse<Shot>>(`/shots/${shotId}`);
  return response.data;
};

export const updateShot = async (shotId: string, payload: ShotPayload) => {
  const response = await api.patch<ApiResponse<Shot>>(
    `/shots/${shotId}`,
    payload,
  );
  return response.data;
};

export const deleteShot = async (shotId: string) => {
  const response = await api.delete<ApiResponse>(`/shots/${shotId}`);
  return response.data;
};

export const assignShotToEmployee = async (
  shotId: string,
  employeeId: string,
) => {
  const response = await api.post<ApiResponse<ShotAssignment>>(
    `/shot-assigned/${shotId}/employee/${employeeId}`,
  );
  return response.data;
};

export const getMyAssignedShots = async () => {
  const response = await api.get<ApiResponse<ShotAssignment[]>>(
    "/shot-assigned/my-shots",
  );
  return response.data;
};

export const removeShotAssignment = async (
  shotId: string,
  employeeId: string,
) => {
  const response = await api.delete<ApiResponse>(
    `/shot-assigned/${shotId}/employee/${employeeId}`,
  );
  return response.data;
};
