
import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import chatReducer from "./chatSlice";
import employeeReducer from "./employeeSlice";
import notificationReducer from "./notificationSlice";
import projectReducer from "./projectSlice";


// ==========================================
// STORE
// ==========================================

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    employee: employeeReducer,
    notifications: notificationReducer,
    projects: projectReducer,
  },
});


// ==========================================
// TYPES
// ==========================================

export type RootState = ReturnType<
  typeof store.getState
>;

export type AppDispatch =
  typeof store.dispatch;

