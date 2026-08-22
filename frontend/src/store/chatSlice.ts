import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  createConversation,
  getConversations,
  getMessages,
  markMessagesRead,
} from "../api/chatApi";
import type { Conversation, Message } from "../types/chat";
import { getErrorMessage, toArray, unwrapApiData } from "../utils/api";

type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

interface ChatState {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  activeConversationId: string | null;
  typingUserIds: Record<string, string[]>;
  socketStatus: SocketStatus;
  currentCall: { event: string; data: object } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  typingUserIds: {},
  socketStatus: "disconnected",
  currentCall: null,
  isLoading: false,
  error: null,
};

export const fetchConversations = createAsyncThunk<
  Conversation[],
  void,
  { rejectValue: string }
>("chat/fetchConversations", async (_, { rejectWithValue }) => {
  try {
    return toArray<Conversation>(unwrapApiData(await getConversations()));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load conversations."));
  }
});

export const createConversationAction = createAsyncThunk<
  Conversation,
  string,
  { rejectValue: string }
>("chat/createConversation", async (userId, { rejectWithValue }) => {
  try {
    return unwrapApiData<Conversation>(await createConversation(userId));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to create conversation."));
  }
});

export const fetchMessages = createAsyncThunk<
  { conversationId: string; messages: Message[] },
  string,
  { rejectValue: string }
>("chat/fetchMessages", async (conversationId, { rejectWithValue }) => {
  try {
    return {
      conversationId,
      messages: toArray<Message>(unwrapApiData(await getMessages(conversationId))),
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load messages."));
  }
});

export const markMessagesReadAction = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("chat/markMessagesRead", async (conversationId, { rejectWithValue }) => {
  try {
    await markMessagesRead(conversationId);
    return conversationId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to mark messages as read."));
  }
});

const upsertMessage = (messages: Message[], message: Message) => {
  const index = messages.findIndex((item) => item.id === message.id);

  if (index >= 0) {
    messages[index] = message;
  } else {
    messages.push(message);
  }
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
    },
    messageReceived: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const messages = state.messagesByConversation[message.conversationId] ?? [];
      upsertMessage(messages, message);
      state.messagesByConversation[message.conversationId] = messages;
    },
    userTyping: (state, action: PayloadAction<{ userId: string }>) => {
      if (!state.activeConversationId) {
        return;
      }

      const users = state.typingUserIds[state.activeConversationId] ?? [];
      if (!users.includes(action.payload.userId)) {
        users.push(action.payload.userId);
      }
      state.typingUserIds[state.activeConversationId] = users;
    },
    userStoppedTyping: (state, action: PayloadAction<{ userId: string }>) => {
      if (!state.activeConversationId) {
        return;
      }

      const users = state.typingUserIds[state.activeConversationId] ?? [];
      state.typingUserIds[state.activeConversationId] = users.filter(
        (userId) => userId !== action.payload.userId,
      );
    },
    messagesRead: (state, action: PayloadAction<{ conversationId: string; readBy: string }>) => {
      state.messagesByConversation[action.payload.conversationId]?.forEach((message) => {
        if (message.senderId !== action.payload.readBy) {
          message.isRead = true;
        }
      });
    },
    socketStatusChanged: (state, action: PayloadAction<SocketStatus>) => {
      state.socketStatus = action.payload;
    },
    socketErrorReceived: (state, action: PayloadAction<string>) => {
      state.socketStatus = "error";
      state.error = action.payload;
    },
    callEventReceived: (state, action: PayloadAction<{ event: string; data: object }>) => {
      state.currentCall = action.payload;
    },
    clearCall: (state) => {
      state.currentCall = null;
    },
    clearChatError: (state) => {
      state.error = null;
    },
    clearChat: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Unable to load conversations.";
      })
      .addCase(createConversationAction.fulfilled, (state, action) => {
        const index = state.conversations.findIndex(
          (conversation) => conversation.id === action.payload.id,
        );
        if (index >= 0) {
          state.conversations[index] = action.payload;
        } else {
          state.conversations.unshift(action.payload);
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesByConversation[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(markMessagesReadAction.fulfilled, (state, action) => {
        state.messagesByConversation[action.payload]?.forEach((message) => {
          message.isRead = true;
        });
      });
  },
});

export const {
  callEventReceived,
  clearCall,
  clearChat,
  clearChatError,
  messageReceived,
  messagesRead,
  setActiveConversation,
  socketErrorReceived,
  socketStatusChanged,
  userStoppedTyping,
  userTyping,
} = chatSlice.actions;

export default chatSlice.reducer;
