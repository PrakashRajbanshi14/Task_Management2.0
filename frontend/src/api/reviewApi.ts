import api from "./axios";
import type { ReviewPayload } from "../types/submission";
import type { ApiResponse } from "../utils/api";

export const approveSubmission = async (submissionId: string, payload: ReviewPayload) => {
  const response = await api.post<ApiResponse>(
    `/shots-review/${submissionId}/approve`,
    payload,
  );
  return response.data;
};

export const requestRedo = async (submissionId: string, payload: ReviewPayload) => {
  const response = await api.post<ApiResponse>(
    `/shots-review/${submissionId}/redo`,
    payload,
  );
  return response.data;
};
