import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface NotificationItem {
  _id: string;
  sender: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  type: 'like' | 'comment' | 'follow';
  post?: {
    _id: string;
    image: string;
  };
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.notifications = action.payload;
    },
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    markAllRead: (state) => {
      state.notifications = state.notifications.map(n => ({ ...n, read: true }));
      state.unreadCount = 0;
    },
  }
});

export const { setNotifications, addNotification, setUnreadCount, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
