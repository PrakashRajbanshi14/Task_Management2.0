import type { User } from "./auth";

export interface Conversation {
  id: string;
  participantOneId?: string;
  participantTwoId?: string;
  userOneId?: string;
  userTwoId?: string;
  participantOne?: User;
  participantTwo?: User;
  lastMessage?: Message;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  messageType: "text" | "audioCall" | "videoCall" | "screenShare";
  isRead: boolean;
  readAt?: string | null;
  sender?: Pick<User, "id" | "fullName" | "profileImage" | "role">;
  createdAt?: string;
  updatedAt?: string;
}
