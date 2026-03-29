import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Message } from "../types";

interface ChatState {
  onlineUsers: string[];
  messages: Message[];
  typingUsers: string[];
  unreadCounts: Record<string, number>; // userId -> unread count
}

const initialState: ChatState = {
  onlineUsers: [],
  messages: [],
  typingUsers: [],
  unreadCounts: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    removeMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(m => m._id !== action.payload);
    },
    updateMessageReactions: (state, action: PayloadAction<{ messageId: string; reactions: { userId: string; emoji: string }[] }>) => {
      const msg = state.messages.find(m => m._id === action.payload.messageId);
      if (msg) {
        msg.reactions = action.payload.reactions;
      }
    },
    markMessagesAsRead: (state) => {
      state.messages.forEach(msg => { msg.read = true; });
    },
    addTypingUser: (state, action: PayloadAction<string>) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(id => id !== action.payload);
    },
    setUnreadCounts: (state, action: PayloadAction<Record<string, number>>) => {
      state.unreadCounts = action.payload;
    },
    incrementUnread: (state, action: PayloadAction<string>) => {
      state.unreadCounts[action.payload] = (state.unreadCounts[action.payload] || 0) + 1;
    },
    clearUnread: (state, action: PayloadAction<string>) => {
      delete state.unreadCounts[action.payload];
    },
  }
});

export const {
  setOnlineUsers, setMessages, addMessage, removeMessage, updateMessageReactions, markMessagesAsRead,
  addTypingUser, removeTypingUser, setUnreadCounts, incrementUnread, clearUnread
} = chatSlice.actions;
export default chatSlice.reducer;
