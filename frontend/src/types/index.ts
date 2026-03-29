export interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  gender?: 'male' | 'female';
  followers: string[];
  following: string[];
  posts: Post[];
  bookmarks?: Post[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Post {
  _id: string;
  caption: string;
  image: string;
  author: User;
  likes: string[];
  comments: Comment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  _id: string;
  text: string;
  author: User;
  post: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  read?: boolean;
  messageType?: 'text' | 'image' | 'voice';
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  replyTo?: {
    _id: string;
    message: string;
    senderId: string;
    messageType?: string;
  };
  reactions?: { userId: string; emoji: string }[];
  storyReply?: {
    storyId: string;
    storyImage: string;
  };
  senderInfo?: {
    username: string;
    profilePicture?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  messages: Message[];
  createdAt?: string;
  updatedAt?: string;
}
