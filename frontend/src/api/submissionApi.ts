import api from "./axios";
import type { ReviewPayload, ShotSubmission } from "../types/submission";
import type { ApiResponse } from "../utils/api";

export const submitShot = async (
  shotId: string,
  payload: {
    videoLength: number;
    video?: File | null;
    projectFiles?: File[];
  },
) => {
  const formData = new FormData();
  formData.append("videoLength", String(payload.videoLength));

  if (payload.video) {
    formData.append("video", payload.video);
  }

  payload.projectFiles?.forEach((file) => {
    formData.append("projectFiles", file);
  });

  const response = await api.post<ApiResponse<ShotSubmission>>(
    `/shot-submission/${shotId}/submit`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const getShotSubmissions = async (shotId: string) => {
  const response = await api.get<ApiResponse<ShotSubmission[]>>(
    `/shot-submission/shot/${shotId}`,
  );
  return response.data;
};

export const getSubmission = async (submissionId: string) => {
  const response = await api.get<ApiResponse<ShotSubmission>>(
    `/shot-submission/${submissionId}`,
  );
  return response.data;
};

export const approveSubmission = async (
  submissionId: string,
  payload: ReviewPayload,
) => {
  const response = await api.post<ApiResponse>(
    `/shots-review/${submissionId}/approve`,
    payload,
  );
  return response.data;
};

export const requestRedo = async (
  submissionId: string,
  payload: ReviewPayload,
) => {
  const response = await api.post<ApiResponse>(
    `/shots-review/${submissionId}/redo`,
    payload,
  );
  return response.data;
};

export const deleteSubmission = async (submissionId: string) => {
  const response = await api.patch<ApiResponse>(
    `/shot-submission/${submissionId}`,
  );
  return response.data;
};
