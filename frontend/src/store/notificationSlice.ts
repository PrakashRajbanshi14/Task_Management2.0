import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  deleteNotification,
  getNotifications,
  getUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationApi";
import type { Notification } from "../types/notification";
import { getErrorMessage, toArray, unwrapApiData } from "../utils/api";

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const upsertNotification = (items: Notification[], notification: Notification) => {
  const index = items.findIndex((item) => item.id === notification.id);

  if (index >= 0) {
    items[index] = notification;
  } else {
    items.unshift(notification);
  }
};

const countUnread = (items: Notification[]) => items.filter((item) => !item.isRead).length;

export const fetchNotifications = createAsyncThunk<
  Notification[],
  void,
  { rejectValue: string }
>("notifications/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return toArray<Notification>(unwrapApiData(await getNotifications()));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load notifications."));
  }
});

export const fetchUnreadNotifications = createAsyncThunk<
  Notification[],
  void,
  { rejectValue: string }
>("notifications/fetchUnread", async (_, { rejectWithValue }) => {
  try {
    return toArray<Notification>(unwrapApiData(await getUnreadNotifications()));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to load unread notifications."));
  }
});

export const markNotificationReadAction = createAsyncThunk<
  Notification | undefined,
  string,
  { rejectValue: string }
>("notifications/markRead", async (notificationId, { rejectWithValue }) => {
  try {
    return unwrapApiData<Notification>(await markNotificationRead(notificationId));
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to mark notification as read."));
  }
});

export const markAllNotificationsReadAction = createAsyncThunk<void, void, { rejectValue: string }>(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await markAllNotificationsRead();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Unable to mark notifications as read."));
    }
  },
);

export const deleteNotificationAction = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notifications/delete", async (notificationId, { rejectWithValue }) => {
  try {
    await deleteNotification(notificationId);
    return notificationId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Unable to delete notification."));
  }
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    notificationReceived: (state, action: PayloadAction<Notification>) => {
      upsertNotification(state.items, action.payload);
      state.unreadCount = countUnread(state.items);
    },
    clearNotificationError: (state) => {
      state.error = null;
    },
    clearNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.unreadCount = countUnread(action.payload);
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Unable to load notifications.";
      })
      .addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
        action.payload.forEach((notification) => upsertNotification(state.items, notification));
        state.unreadCount = action.payload.length;
      })
      .addCase(markNotificationReadAction.fulfilled, (state, action) => {
        if (action.payload) {
          upsertNotification(state.items, action.payload);
        }
        state.unreadCount = countUnread(state.items);
      })
      .addCase(markAllNotificationsReadAction.fulfilled, (state) => {
        state.items.forEach((notification) => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(deleteNotificationAction.fulfilled, (state, action) => {
        state.items = state.items.filter((notification) => notification.id !== action.payload);
        state.unreadCount = countUnread(state.items);
      });
  },
});

export const { clearNotificationError, clearNotifications, notificationReceived } =
  notificationSlice.actions;

export default notificationSlice.reducer;
