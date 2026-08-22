import { Server } from "socket.io";

import { Op } from "sequelize";

import Conversation from "../database/models/conversationModel";

import Message from "../database/models/messageModel";

import User from "../database/models/userModel";

import {
  UserRole,
  MessageType,
  CallStatus,
} from "../globals/types";

import {
  AuthenticatedSocket,
} from "./types";


const allowedRoles = [
  UserRole.Employee,
  UserRole.ProjectManager,
  UserRole.Admin,
];


// ==========================================
// CALL TYPE
// ==========================================

type CallType =
  | "audio"
  | "video";


// ==========================================
// WEBRTC TYPES
// ==========================================

interface RTCSessionDescriptionPayload {

  type: string;

  sdp?: string;

}


interface RTCIceCandidatePayload {

  candidate: string;

  sdpMid?: string | null;

  sdpMLineIndex?: number | null;

  usernameFragment?: string | null;

}


// ==========================================
// CALL DATA
// ==========================================

interface CallOfferData {

  conversationId: string;

  callId: string;

  callType: CallType;

  offer: RTCSessionDescriptionPayload;

}


interface CallAnswerData {

  conversationId: string;

  callId: string;

  answer: RTCSessionDescriptionPayload;

}


interface IceCandidateData {

  conversationId: string;

  callId: string;

  candidate: RTCIceCandidatePayload;

}


interface CallActionData {

  conversationId: string;

  callId: string;

}


interface EndCallData
  extends CallActionData {

  callType: CallType;

  duration?: number;

}


// ==========================================
// ROLE VALIDATION
// ==========================================

const canUsersChat = (
  userOne: User,
  userTwo: User,
) => {

  const roles = [
    userOne.role,
    userTwo.role,
  ];


  const employeePM =
    roles.includes(UserRole.Employee) &&
    roles.includes(UserRole.ProjectManager);


  const employeeAdmin =
    roles.includes(UserRole.Employee) &&
    roles.includes(UserRole.Admin);


  const pmAdmin =
    roles.includes(UserRole.ProjectManager) &&
    roles.includes(UserRole.Admin);


  return (
    employeePM ||
    employeeAdmin ||
    pmAdmin
  );
};


// ==========================================
// GET PARTICIPANT
// ==========================================

const getConversationParticipant = async (
  conversationId: string,
  userId: string,
) => {

  const conversation =
    await Conversation.findOne({

      where: {

        id: conversationId,

        [Op.or]: [
          {
            userOneId: userId,
          },

          {
            userTwoId: userId,
          },
        ],

      },

    });


  if (!conversation) {
    return null;
  }


  const receiverId =
    conversation.userOneId === userId
      ? conversation.userTwoId
      : conversation.userOneId;


  const receiver =
    await User.findByPk(receiverId);


  if (!receiver) {
    return null;
  }


  return {
    conversation,
    receiver,
  };

};


// ==========================================
// SAVE CALL HISTORY
// ==========================================

const saveCallHistory = async ({
  conversationId,
  senderId,
  callType,
  status,
  duration,
}: {
  conversationId: string;

  senderId: string;

  callType: CallType;

  status: CallStatus;

  duration?: number;
}) => {

  let icon = "📞";

  let type = MessageType.audioCall;


  if (callType === "video") {

    icon = "📹";

    type = MessageType.videoCall;

  }


  let message = "";


  if (status === CallStatus.ended) {

    const seconds =
      Math.max(
        0,
        Math.floor(duration || 0),
      );


    const minutes =
      Math.floor(seconds / 60);


    const remainingSeconds =
      seconds % 60;


    const formattedDuration =
      `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds,
      ).padStart(2, "0")}`;


    message =
      `${icon} ${
        callType === "audio"
          ? "Audio"
          : "Video"
      } call — completed — ${formattedDuration}`;

  }


  else if (
    status === CallStatus.rejected
  ) {

    message =
      `${icon} ${
        callType === "audio"
          ? "Audio"
          : "Video"
      } call — declined`;

  }


  else if (
    status === CallStatus.missed
  ) {

    message =
      `${icon} ${
        callType === "audio"
          ? "Audio"
          : "Video"
      } call — missed`;

  }


  else {

    message =
      `${icon} ${
        callType === "audio"
          ? "Audio"
          : "Video"
      } call`;

  }


  const savedMessage =
    await Message.create({

      conversationId,

      senderId,

      message,

      messageType: type,

      isRead: false,

      readAt: null,

    });


  return savedMessage;

};


// ==========================================
// REGISTER CALL SOCKET
// ==========================================

export const registerCallSocket = (
  io: Server,
) => {

  io.on(
    "connection",
    (
      socket: AuthenticatedSocket,
    ) => {

      const user =
        socket.data.user;


      if (!user) {
        return;
      }


      console.log(
        `Call socket ready: ${user.id}`,
      );


      // ======================================
      // START CALL
      // ======================================

      socket.on(
        "call:start",
        async (
          data: {
            conversationId: string;
            callId: string;
            callType: CallType;
          },
        ) => {

          try {

            const {
              conversationId,
              callId,
              callType,
            } = data;


            if (
              !conversationId ||
              !callId ||
              !callType
            ) {

              socket.emit(
                "call:error",
                {
                  message:
                    "Conversation ID, call ID and call type are required.",
                },
              );

              return;

            }


            if (
              callType !== "audio" &&
              callType !== "video"
            ) {

              socket.emit(
                "call:error",
                {
                  message:
                    "Invalid call type.",
                },
              );

              return;

            }


            const result =
              await getConversationParticipant(
                conversationId,
                user.id,
              );


            if (!result) {

              socket.emit(
                "call:error",
                {
                  message:
                    "You are not a member of this conversation.",
                },
              );

              return;

            }


            const {
              receiver,
            } = result;


            if (
              !allowedRoles.includes(
                user.role as UserRole,
              ) ||
              !allowedRoles.includes(
                receiver.role as UserRole,
              )
            ) {

              socket.emit(
                "call:error",
                {
                  message:
                    "Calling is not allowed.",
                },
              );

              return;

            }


            if (
              !canUsersChat(
                user,
                receiver,
              )
            ) {

              socket.emit(
                "call:error",
                {
                  message:
                    "These users cannot call each other.",
                },
              );

              return;

            }


            // Send incoming call to receiver

            io.to(
              `user:${receiver.id}`,
            ).emit(
              "call:incoming",
              {

                callId,

                conversationId,

                callType,

                caller: {
                  id: user.id,
                  fullName: user.fullName,
                  profileImage:
                    user.profileImage,
                },

              },
            );


            // Confirm to caller

            socket.emit(
              "call:started",
              {
                callId,
                conversationId,
                callType,
              },
            );


          } catch (error) {

            console.error(
              "Call Start Error:",
              error,
            );

          }

        },
      );


      // ======================================
      // WEBRTC OFFER
      // ======================================

      socket.on(
        "call:offer",
        async (
          data: CallOfferData,
        ) => {

          try {

            const result =
              await getConversationParticipant(
                data.conversationId,
                user.id,
              );


            if (!result) {
              return;
            }


            io.to(
              `user:${result.receiver.id}`,
            ).emit(
              "call:offer",
              {

                callId:
                  data.callId,

                conversationId:
                  data.conversationId,

                callType:
                  data.callType,

                offer:
                  data.offer,

                callerId:
                  user.id,

              },
            );


          } catch (error) {

            console.error(
              "Call Offer Error:",
              error,
            );

          }

        },
      );


      // ======================================
      // WEBRTC ANSWER
      // ======================================

      socket.on(
        "call:answer",
        async (
          data: CallAnswerData,
        ) => {

          try {

            const result =
              await getConversationParticipant(
                data.conversationId,
                user.id,
              );


            if (!result) {
              return;
            }


            io.to(
              `user:${result.receiver.id}`,
            ).emit(
              "call:answer",
              {

                callId:
                  data.callId,

                conversationId:
                  data.conversationId,

                answer:
                  data.answer,

                answeredBy:
                  user.id,

              },
            );


          } catch (error) {

            console.error(
              "Call Answer Error:",
              error,
            );

          }

        },
      );


      // ======================================
      // ICE CANDIDATE
      // ======================================

      socket.on(
        "call:ice-candidate",
        async (
          data: IceCandidateData,
        ) => {

          try {

            const result =
              await getConversationParticipant(
                data.conversationId,
                user.id,
              );


            if (!result) {
              return;
            }


            io.to(
              `user:${result.receiver.id}`,
            ).emit(
              "call:ice-candidate",
              {

                callId:
                  data.callId,

                conversationId:
                  data.conversationId,

                candidate:
                  data.candidate,

              },
            );


          } catch (error) {

            console.error(
              "ICE Candidate Error:",
              error,
            );

          }

        },
      );


      // ======================================
      // ACCEPT CALL
      // ======================================

      socket.on(
        "call:accepted",
        async (
          data: CallActionData,
        ) => {

          try {

            const result =
              await getConversationParticipant(
                data.conversationId,
                user.id,
              );


            if (!result) {
              return;
            }


            io.to(
              `user:${result.receiver.id}`,
            ).emit(
              "call:accepted",
              {

                callId:
                  data.callId,

                conversationId:
                  data.conversationId,

                acceptedBy:
                  user.id,

              },
            );


          } catch (error) {

            console.error(
              "Call Accepted Error:",
              error,
            );

          }

        },
      );


      // ======================================
      // REJECT CALL
      // ======================================

      socket.on(
        "call:rejected",
        async (
          data: CallActionData & {
            callType: CallType;
          },
        ) => {

          try {

            const result =
              await getConversationParticipant(
                data.conversationId,
                user.id,
              );


            if (!result) {
              return;
            }


            await saveCallHistory({

              conversationId:
                data.conversationId,

              senderId:
                user.id,

              callType:
                data.callType,

              status:
                CallStatus.rejected,

            });


            io.to(
              `conversation:${data.conversationId}`,
            ).emit(
              "call:rejected",
              {

                callId:
                  data.callId,

                conversationId:
                  data.conversationId,

                rejectedBy:
                  user.id,

              },
            );


          } catch (error) {

            console.error(
              "Call Rejected Error:",
              error,
            );

          }

        },
      );


      // ======================================
      // MISSED CALL
      // ======================================

      socket.on(
        "call:missed",
        async (
          data: CallActionData & {
            callType: CallType;
          },
        ) => {

          try {

            const result =
              await getConversationParticipant(
                data.conversationId,
                user.id,
              );


            if (!result) {
              return;
            }


            await saveCallHistory({

              conversationId:
                data.conversationId,

              senderId:
                user.id,

              callType:
                data.callType,

              status:
                CallStatus.missed,

            });


            io.to(
              `conversation:${data.conversationId}`,
            ).emit(
              "call:missed",
              {

                callId:
                  data.callId,

                conversationId:
                  data.conversationId,

              },
            );


          } catch (error) {

            console.error(
              "Missed Call Error:",
              error,
            );

          }

        },
      );


      // ======================================
      // END CALL
      // ======================================

      socket.on(
        "call:end",
        async (
          data: EndCallData,
        ) => {

          try {

            const result =
              await getConversationParticipant(
                data.conversationId,
                user.id,
              );


            if (!result) {
              return;
            }


            const history =
              await saveCallHistory({

                conversationId:
                  data.conversationId,

                senderId:
                  user.id,

                callType:
                  data.callType,

                status:
                  CallStatus.ended,

                duration:
                  data.duration || 0,

              });


            io.to(
              `conversation:${data.conversationId}`,
            ).emit(
              "call:ended",
              {

                callId:
                  data.callId,

                conversationId:
                  data.conversationId,

                endedBy:
                  user.id,

                duration:
                  data.duration || 0,

                history,

              },
            );


          } catch (error) {

            console.error(
              "Call End Error:",
              error,
            );

          }

        },
      );


      // ======================================
      // CALL BUSY
      // ======================================

      socket.on(
        "call:busy",
        async (
          data: CallActionData & {
            callType: CallType;
          },
        ) => {

          try {

            const result =
              await getConversationParticipant(
                data.conversationId,
                user.id,
              );


            if (!result) {
              return;
            }


            io.to(
              `user:${result.receiver.id}`,
            ).emit(
              "call:busy",
              {

                callId:
                  data.callId,

                conversationId:
                  data.conversationId,

              },
            );


          } catch (error) {

            console.error(
              "Call Busy Error:",
              error,
            );

          }

        },
      );


      // ======================================
      // SCREEN SHARE STARTED
      // ======================================

      socket.on(
        "screen-share:started",
        async (
          data: CallActionData,
        ) => {

          try {

            const result =
              await getConversationParticipant(
                data.conversationId,
                user.id,
              );


            if (!result) {
              return;
            }


            io.to(
              `conversation:${data.conversationId}`,
            ).emit(
              "screen-share:started",
              {

                callId:
                  data.callId,

                userId:
                  user.id,

              },
            );


          } catch (error) {

            console.error(
              "Screen Share Start Error:",
              error,
            );

          }

        },
      );


      // ======================================
      // SCREEN SHARE STOPPED
      // ======================================

      socket.on(
        "screen-share:stopped",
        async (
          data: CallActionData,
        ) => {

          try {

            const result =
              await getConversationParticipant(
                data.conversationId,
                user.id,
              );


            if (!result) {
              return;
            }


            io.to(
              `conversation:${data.conversationId}`,
            ).emit(
              "screen-share:stopped",
              {

                callId:
                  data.callId,

                userId:
                  user.id,

              },
            );


          } catch (error) {

            console.error(
              "Screen Share Stop Error:",
              error,
            );

          }

        },
      );

    },
  );

};