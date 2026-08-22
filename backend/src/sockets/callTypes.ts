import {
  CallStatus,
} from "../globals/types";


export type CallType =
  | "audio"
  | "video";


export interface CallOfferData {

  conversationId: string;

  callId: string;

  callType: CallType;

  offer: RTCSessionDescriptionInit;

}


export interface CallAnswerData {

  conversationId: string;

  callId: string;

  answer: RTCSessionDescriptionInit;

}


export interface IceCandidateData {

  conversationId: string;

  callId: string;

  candidate: RTCIceCandidateInit;

}


export interface CallActionData {

  conversationId: string;

  callId: string;

}


export interface CallEndData
  extends CallActionData {

  callType: CallType;

  duration?: number;

}


export interface CallHistoryData {

  callType: CallType;

  status: CallStatus;

  duration?: number;

}