import api from "./axios";
import type { Notification } from "../types/notification";
import type { ApiResponse } from "../utils/api";

export const getNotifications = async () => {
  const response = await api.get<ApiResponse<Notification[]>>("/notifications");
  return response.data;
};

export const getUnreadNotifications = async () => {
  const response = await api.get<ApiResponse<Notification[]>>(
    "/notifications/unread",
  );
  return response.data;
};

export const getNotification = async (notificationId: string) => {
  const response = await api.get<ApiResponse<Notification>>(
    `/notifications/${notificationId}`,
  );
  return response.data;
};

export const markNotificationRead = async (notificationId: string) => {
  const response = await api.patch<ApiResponse<Notification>>(
    `/notifications/${notificationId}/read`,
  );
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch<ApiResponse>("/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (notificationId: string) => {
  const response = await api.delete<ApiResponse>(
    `/notifications/${notificationId}`,
  );
  return response.data;
};
