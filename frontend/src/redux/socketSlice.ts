import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Socket } from "socket.io-client";

interface SocketState {
  socket: Socket | null;
}

const initialState: SocketState = {
  socket: null
};

const socketSlice = createSlice({
  name: "socketio",
  initialState,
  reducers: {
    setSocket: (state, action: PayloadAction<Socket | null>) => {
      // Type assertion to tell TypeScript this is safe
      (state as any).socket = action.payload;
    }
  }
});

export const { setSocket } = socketSlice.actions;
export default socketSlice.reducer;
