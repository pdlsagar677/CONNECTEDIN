import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface StoryItem {
  _id: string;
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  image: string;
  caption: string;
  viewers: string[];
  expiresAt: string;
  createdAt: string;
}

export interface StoryGroup {
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  stories: StoryItem[];
  hasUnviewed: boolean;
}

interface StoryState {
  storyFeed: StoryGroup[];
}

const initialState: StoryState = {
  storyFeed: [],
};

const storySlice = createSlice({
  name: "story",
  initialState,
  reducers: {
    setStoryFeed: (state, action: PayloadAction<StoryGroup[]>) => {
      state.storyFeed = action.payload;
    },
    markStoryViewed: (state, action: PayloadAction<{ storyId: string; userId: string }>) => {
      for (const group of state.storyFeed) {
        const story = group.stories.find(s => s._id === action.payload.storyId);
        if (story && !story.viewers.includes(action.payload.userId)) {
          story.viewers.push(action.payload.userId);
        }
        group.hasUnviewed = group.stories.some(s => !s.viewers.includes(action.payload.userId));
      }
    },
    removeStory: (state, action: PayloadAction<string>) => {
      for (const group of state.storyFeed) {
        group.stories = group.stories.filter(s => s._id !== action.payload);
      }
      state.storyFeed = state.storyFeed.filter(g => g.stories.length > 0);
    },
  }
});

export const { setStoryFeed, markStoryViewed, removeStory } = storySlice.actions;
export default storySlice.reducer;
