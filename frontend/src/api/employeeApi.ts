import api from "./axios";
import type { EmployeeWorkDetail, EmployeeWorkShot } from "../types/employee";
import type { ApiResponse } from "../utils/api";

export const getMyWorkDetails = async (params?: {
  month?: number;
  year?: number;
}) => {
  const response = await api.get<ApiResponse<EmployeeWorkDetail[]>>(
    "/employee-work-details/my",
    { params },
  );
  return response.data;
};

export const getMyMonthlyWorkDetails = async (year: number, month: number) => {
  const response = await api.get<ApiResponse<EmployeeWorkDetail>>(
    `/employee-work-details/my/${year}/${month}`,
  );
  return response.data;
};

export const getAdminWorkDetails = async (params?: {
  month?: number;
  year?: number;
}) => {
  const response = await api.get<ApiResponse<EmployeeWorkDetail[]>>(
    "/employee-work-details/admin/all",
    { params },
  );
  return response.data;
};

export const getUnpaidWorkDetails = async () => {
  const response = await api.get<ApiResponse<EmployeeWorkDetail[]>>(
    "/employee-work-details/admin/unpaid",
  );
  return response.data;
};

export const getEmployeeWorkDetails = async (
  employeeId: string,
  params?: { month?: number; year?: number },
) => {
  const response = await api.get<ApiResponse<EmployeeWorkDetail[]>>(
    `/employee-work-details/admin/employee/${employeeId}`,
    { params },
  );
  return response.data;
};

export const getEmployeeMonthlyWorkDetails = async (
  employeeId: string,
  year: number,
  month: number,
) => {
  const response = await api.get<ApiResponse<EmployeeWorkDetail>>(
    `/employee-work-details/admin/employee/${employeeId}/${year}/${month}`,
  );
  return response.data;
};

export const updateSalaryStatus = async (
  workDetailId: string,
  salaryStatus: "paid" | "unpaid",
) => {
  const response = await api.patch<ApiResponse>(
    `/employee-work-details/admin/${workDetailId}/salary-status`,
    { salaryStatus },
  );
  return response.data;
};

export const getWorkShots = async (workDetailId: string) => {
  const response = await api.get<ApiResponse<EmployeeWorkShot[]>>(
    `/employee-work-shots/work/${workDetailId}`,
  );
  return response.data;
};

export const getMyWorkShots = async (workDetailId: string) => {
  const response = await api.get<ApiResponse<EmployeeWorkShot[]>>(
    `/employee-work-shots/my/${workDetailId}`,
  );
  return response.data;
};

export const getWorkShot = async (workShotId: string) => {
  const response = await api.get<ApiResponse<EmployeeWorkShot>>(
    `/employee-work-shots/${workShotId}`,
  );
  return response.data;
};

export const deleteWorkShot = async (workShotId: string) => {
  const response = await api.delete<ApiResponse>(
    `/employee-work-shots/${workShotId}`,
  );
  return response.data;
};
