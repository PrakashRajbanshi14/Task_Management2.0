import api from "./axios";
import type { Conversation, Message } from "../types/chat";
import type { ApiResponse } from "../utils/api";

export const getConversations = async () => {
  const response = await api.get<ApiResponse<Conversation[]>>("/conversations");
  return response.data;
};

export const createConversation = async (userId: string) => {
  const response = await api.post<ApiResponse<Conversation>>("/conversations", {
    userId,
  });
  return response.data;
};

export const getMessages = async (conversationId: string) => {
  const response = await api.get<ApiResponse<Message[]>>(
    `/messages/${conversationId}`,
  );
  return response.data;
};

export const markMessagesRead = async (conversationId: string) => {
  const response = await api.patch<ApiResponse>(`/messages/${conversationId}/read`);
  return response.data;
};
