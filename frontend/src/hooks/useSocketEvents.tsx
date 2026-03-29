import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setPosts } from "../redux/postSlice";
import { addTypingUser, removeTypingUser } from "../redux/chatSlice";
import type { Post } from "../types";

const useSocketEvents = (): void => {
  const dispatch = useDispatch();
  const { socket } = useSelector((store: RootState) => store.socketio);
  const posts = useSelector((store: RootState) => store.post?.posts || []);
  const postsRef = useRef<Post[]>(posts);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    if (!socket) return;
    const s = socket as any;

    const handlePostLikeUpdate = ({ postId, likes }: { postId: string; likes: string[] }) => {
      const updatedPosts = postsRef.current.map(p =>
        p._id === postId ? { ...p, likes } : p
      );
      dispatch(setPosts(updatedPosts));
    };

    const handleTyping = ({ senderId }: { senderId: string }) => {
      dispatch(addTypingUser(senderId));
    };

    const handleStopTyping = ({ senderId }: { senderId: string }) => {
      dispatch(removeTypingUser(senderId));
    };

    s.on('postLikeUpdate', handlePostLikeUpdate);
    s.on('typing', handleTyping);
    s.on('stopTyping', handleStopTyping);

    return () => {
      s.off('postLikeUpdate', handlePostLikeUpdate);
      s.off('typing', handleTyping);
      s.off('stopTyping', handleStopTyping);
    };
  }, [socket, dispatch]);
};

export default useSocketEvents;
