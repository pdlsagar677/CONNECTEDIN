import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Post } from "../types";

interface PostState {
  posts: Post[];
  selectedPost: Post | null;
}

const initialState: PostState = {
  posts: [],
  selectedPost: null,
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
    },
    appendPosts: (state, action: PayloadAction<Post[]>) => {
      const existingIds = new Set(state.posts.map(p => p._id));
      const newPosts = action.payload.filter(p => !existingIds.has(p._id));
      state.posts.push(...newPosts);
    },
    setSelectedPost: (state, action: PayloadAction<Post | null>) => {
      state.selectedPost = action.payload;
    },
  }
});

export const { setPosts, appendPosts, setSelectedPost } = postSlice.actions;
export default postSlice.reducer;
