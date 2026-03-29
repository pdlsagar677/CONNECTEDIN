// src/redux/rtnSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Export the interface
export interface LikeNotification {
  id?: string;
  userId: string;
  type: 'like' | 'dislike';
  postId?: string;
  timestamp?: Date | string;
}

interface RTNState {
  likeNotification: LikeNotification[];
}

const initialState: RTNState = {
  likeNotification: [],
};

const rtnSlice = createSlice({
  name: 'realTimeNotification',
  initialState,
  reducers: {
    setLikeNotification: (state, action: PayloadAction<LikeNotification>) => {
      if (action.payload.type === 'like') {
        state.likeNotification.push(action.payload);
      } else if (action.payload.type === 'dislike') {
        state.likeNotification = state.likeNotification.filter(
          (item) => item.userId !== action.payload.userId
        );
      }
    }
  }
});

export const { setLikeNotification } = rtnSlice.actions;
export default rtnSlice.reducer;