import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PeerInfo {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface CallState {
  callStatus: 'idle' | 'calling' | 'ringing' | 'in-call';
  callType: 'audio' | 'video';
  peer: PeerInfo | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callStartTime: number | null;
}

const initialState: CallState = {
  callStatus: 'idle',
  callType: 'audio',
  peer: null,
  isMuted: false,
  isCameraOff: false,
  callStartTime: null,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startOutgoingCall: (state, action: PayloadAction<{ peer: PeerInfo; callType: 'audio' | 'video' }>) => {
      state.callStatus = 'calling';
      state.callType = action.payload.callType;
      state.peer = action.payload.peer;
      state.isMuted = false;
      state.isCameraOff = false;
    },
    setIncomingCall: (state, action: PayloadAction<{ peer: PeerInfo; callType: 'audio' | 'video' }>) => {
      state.callStatus = 'ringing';
      state.callType = action.payload.callType;
      state.peer = action.payload.peer;
    },
    setInCall: (state) => {
      state.callStatus = 'in-call';
      state.callStartTime = Date.now();
    },
    endCall: () => initialState,
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleCamera: (state) => {
      state.isCameraOff = !state.isCameraOff;
    },
  }
});

export const { startOutgoingCall, setIncomingCall, setInCall, endCall, toggleMute, toggleCamera } = callSlice.actions;
export default callSlice.reducer;
