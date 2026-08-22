import type { Message } from "./chat";
import type { Notification } from "./notification";

export type CallType = "audio" | "video";

export interface RTCSessionDescriptionPayload {
  type: RTCSdpType;
  sdp?: string;
}

export interface RTCIceCandidatePayload {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface CallActionPayload {
  conversationId: string;
  callId: string;
}

export interface IncomingCallPayload extends CallActionPayload {
  callType: CallType;
  caller: {
    id: string;
    fullName: string;
    profileImage: string | null;
  };
}

export interface CallHistoryPayload extends CallActionPayload {
  callType?: CallType;
  duration?: number;
  history?: Message;
  endedBy?: string;
  rejectedBy?: string;
}

export interface ServerToClientEvents {
  new_notification: (notification: Notification) => void;
  conversation_joined: (data: { conversationId: string }) => void;
  new_message: (message: Message) => void;
  new_message_notification: (data: {
    conversationId: string;
    message: Message;
  }) => void;
  user_typing: (data: { userId: string }) => void;
  user_stopped_typing: (data: { userId: string }) => void;
  messages_read: (data: { conversationId: string; readBy: string }) => void;
  chat_error: (data: { message: string }) => void;
  "call:incoming": (data: IncomingCallPayload) => void;
  "call:started": (data: CallActionPayload & { callType: CallType }) => void;
  "call:offer": (data: CallActionPayload & {
    callType: CallType;
    offer: RTCSessionDescriptionPayload;
    callerId: string;
  }) => void;
  "call:answer": (data: CallActionPayload & {
    answer: RTCSessionDescriptionPayload;
    answeredBy: string;
  }) => void;
  "call:ice-candidate": (data: CallActionPayload & {
    candidate: RTCIceCandidatePayload;
  }) => void;
  "call:accepted": (data: CallActionPayload & { acceptedBy: string }) => void;
  "call:rejected": (data: CallActionPayload & { rejectedBy: string }) => void;
  "call:missed": (data: CallActionPayload) => void;
  "call:ended": (data: CallHistoryPayload) => void;
  "call:busy": (data: CallActionPayload) => void;
  "screen-share:started": (data: { callId: string; userId: string }) => void;
  "screen-share:stopped": (data: { callId: string; userId: string }) => void;
  "call:error": (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  send_message: (data: { conversationId: string; message: string }) => void;
  typing: (conversationId: string) => void;
  stop_typing: (conversationId: string) => void;
  mark_messages_read: (conversationId: string) => void;
  "call:start": (data: CallActionPayload & { callType: CallType }) => void;
  "call:offer": (data: CallActionPayload & {
    callType: CallType;
    offer: RTCSessionDescriptionPayload;
  }) => void;
  "call:answer": (data: CallActionPayload & {
    answer: RTCSessionDescriptionPayload;
  }) => void;
  "call:ice-candidate": (data: CallActionPayload & {
    candidate: RTCIceCandidatePayload;
  }) => void;
  "call:accepted": (data: CallActionPayload) => void;
  "call:rejected": (data: CallActionPayload & { callType: CallType }) => void;
  "call:missed": (data: CallActionPayload & { callType: CallType }) => void;
  "call:end": (data: CallActionPayload & {
    callType: CallType;
    duration?: number;
  }) => void;
  "call:busy": (data: CallActionPayload & { callType: CallType }) => void;
  "screen-share:started": (data: CallActionPayload) => void;
  "screen-share:stopped": (data: CallActionPayload) => void;
}
