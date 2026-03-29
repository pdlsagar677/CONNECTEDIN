import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MessageCircle, Send, Phone, Video, Image, Mic, MicOff,
  X, Reply, Smile, Check, CheckCheck, Trash2, User as UserIcon
} from 'lucide-react';
import { setSelectedUser } from '../redux/authSlice';
import { setMessages, clearUnread, setUnreadCounts, incrementUnread, updateMessageReactions, removeMessage } from '../redux/chatSlice';
import { startOutgoingCall } from '../redux/callSlice';
import { RootState } from '../redux/store';
import API from '../lib/api';
import useGetAllMessage from '../hooks/useGetAllMessage';
import type { User, Message } from '../types';
import { toast } from 'sonner';

const EMOJI_LIST = ['❤️', '😂', '😮', '😢', '😡', '👍'];

const ChatPage: React.FC = () => {
  const [textMessage, setTextMessage] = useState('');
  const [chatUsers, setChatUsers] = useState<User[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, number | null>>({});
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const user = useSelector((store: RootState) => store.auth?.user);
  const selectedUser = useSelector((store: RootState) => store.auth?.selectedUser);
  const onlineUsers = useSelector((store: RootState) => store.chat?.onlineUsers || []);
  const messages = useSelector((store: RootState) => store.chat?.messages || []);
  const unreadCounts = useSelector((store: RootState) => store.chat?.unreadCounts || {});
  const socket = useSelector((store: RootState) => store.socketio?.socket);
  const typingUsers = useSelector((store: RootState) => store.chat?.typingUsers || []);

  const dispatch = useDispatch();
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useGetAllMessage();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch chat users
  useEffect(() => {
    const fetchChatUsers = async () => {
      try {
        const res = await API.get('/users/chat-users');
        if (res.data.success) setChatUsers(res.data.users || []);
      } catch (error) {
        console.error('Failed to fetch chat users:', error);
      }
    };
    if (user) fetchChatUsers();
  }, [user?._id]);

  // Fetch unread counts
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await API.get('/message/unread-count');
        if (res.data.success) dispatch(setUnreadCounts(res.data.perUser));
      } catch {}
    };
    if (user) fetchUnread();
  }, [user?._id, dispatch]);

  // Mark conversation as read when selecting user
  useEffect(() => {
    if (selectedUser) {
      dispatch(clearUnread(selectedUser._id));
      API.put(`/message/conversation/${selectedUser._id}/read`).catch(() => {});
    }
  }, [selectedUser?._id, dispatch]);

  // Listen for reactions and message read events
  useEffect(() => {
    if (!socket) return;
    const s = socket as any;

    const onReaction = ({ messageId, reactions }: any) => {
      dispatch(updateMessageReactions({ messageId, reactions }));
    };

    const onMessagesRead = () => {
      const updated = messages.map(m =>
        m.senderId === user?._id ? { ...m, read: true } : m
      );
      dispatch(setMessages(updated));
    };

    const onMessageUnsent = ({ messageId }: { messageId: string }) => {
      dispatch(removeMessage(messageId));
    };

    s.on('messageReaction', onReaction);
    s.on('messagesRead', onMessagesRead);
    s.on('messageUnsent', onMessageUnsent);
    return () => {
      s.off('messageReaction', onReaction);
      s.off('messagesRead', onMessagesRead);
      s.off('messageUnsent', onMessageUnsent);
    };
  }, [socket, messages, user?._id, dispatch]);

  // Request last seen for offline users
  useEffect(() => {
    if (!socket || !selectedUser) return;
    if (!onlineUsers.includes(selectedUser._id)) {
      (socket as any).emit('getLastSeen', { targetUserId: selectedUser._id });
    }
    const s = socket as any;
    const onLastSeen = ({ userId, lastSeen }: any) => {
      setLastSeenMap(prev => ({ ...prev, [userId]: lastSeen }));
    };
    s.on('lastSeen', onLastSeen);
    return () => { s.off('lastSeen', onLastSeen); };
  }, [socket, selectedUser?._id, onlineUsers]);

  const sendMessageHandler = async (receiverId: string) => {
    if (!textMessage.trim()) return;
    try {
      const formData = new FormData();
      formData.append('textMessage', textMessage);
      formData.append('messageType', 'text');
      if (replyTo) formData.append('replyTo', replyTo._id);

      const res = await API.post(`/message/send/${receiverId}`, formData);
      if (res.data.success && res.data.newMessage) {
        dispatch(setMessages([...messages, res.data.newMessage]));
        setTextMessage('');
        setReplyTo(null);
      }
    } catch (error: any) {
      console.error('Error sending message:', error.response?.data || error.message);
    }
  };

  const sendImage = async (receiverId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('textMessage', '');
      formData.append('messageType', 'image');

      const res = await API.post(`/message/send/${receiverId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        dispatch(setMessages([...messages, res.data.newMessage]));
      }
    } catch (error) {
      toast.error('Failed to send image');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (selectedUser) {
          const formData = new FormData();
          formData.append('file', blob, 'voice.webm');
          formData.append('textMessage', '');
          formData.append('messageType', 'voice');
          formData.append('voiceDuration', String(recordingDuration));

          try {
            const res = await API.post(`/message/send/${selectedUser._id}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
              dispatch(setMessages([...messages, res.data.newMessage]));
            }
          } catch {
            toast.error('Failed to send voice message');
          }
        }
        setRecordingDuration(0);
      };

      recorder.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const res = await API.put(`/message/${messageId}/react`, { emoji });
      if (res.data.success) {
        dispatch(updateMessageReactions({ messageId, reactions: res.data.reactions }));
      }
    } catch {}
    setShowEmojiFor(null);
  };

  const handleUnsend = async (messageId: string) => {
    try {
      const res = await API.delete(`/message/${messageId}/unsend`);
      if (res.data.success) {
        dispatch(removeMessage(messageId));
        toast.success('Message unsent');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unsend');
    }
  };

  const handleTyping = () => {
    if (socket && selectedUser && user) {
      (socket as any).emit('typing', { senderId: user._id, receiverId: selectedUser._id });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        (socket as any).emit('stopTyping', { senderId: user._id, receiverId: selectedUser._id });
      }, 2000);
    }
  };

  const handleCallStart = (callType: 'audio' | 'video') => {
    if (!selectedUser || !user || !socket) return;
    dispatch(startOutgoingCall({
      peer: { _id: selectedUser._id, username: selectedUser.username, profilePicture: selectedUser.profilePicture },
      callType,
    }));
    (socket as any).emit('call:user', {
      to: selectedUser._id,
      from: user._id,
      callerInfo: { _id: user._id, username: user.username, profilePicture: user.profilePicture },
      callType,
    });
  };

  // Long-press to show actions on mobile, tap to toggle
  const handleMessageTouchStart = useCallback((msgId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setActiveMessageId(prev => prev === msgId ? null : msgId);
      setShowEmojiFor(null);
    }, 400);
  }, []);

  const handleMessageTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleMessageClick = useCallback((msgId: string) => {
    setActiveMessageId(prev => prev === msgId ? null : msgId);
    if (activeMessageId !== msgId) setShowEmojiFor(null);
  }, [activeMessageId]);

  // Close action menu when tapping outside
  useEffect(() => {
    const handleOutsideClick = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-msg-actions]') && !target.closest('[data-msg-bubble]')) {
        setActiveMessageId(null);
        setShowEmojiFor(null);
      }
    };
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const isSelectedUserTyping = selectedUser ? typingUsers.includes(selectedUser._id) : false;
  const isSelectedOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  const getLastSeenText = (userId: string) => {
    const ls = lastSeenMap[userId];
    if (!ls) return 'offline';
    const diff = Math.floor((Date.now() - ls) / 60000);
    if (diff < 1) return 'last seen just now';
    if (diff < 60) return `last seen ${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `last seen ${hours}h ago`;
    return `last seen ${Math.floor(hours / 24)}d ago`;
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  useEffect(() => {
    return () => { dispatch(setSelectedUser(null)); };
  }, [dispatch]);

  return (
    <div className='flex h-[calc(100vh-3.5rem)] md:h-screen bg-gray-100 dark:bg-gray-800'>
      {/* User List — full width on mobile when no user selected, 1/4 on desktop */}
      <section className={`${selectedUser ? 'hidden md:block' : 'w-full'} md:w-1/4 my-0 md:my-8 bg-white dark:bg-gray-900 md:rounded-lg shadow-sm dark:shadow-gray-900/20 overflow-hidden`}>
        <div className='flex items-center justify-between p-4 border-b dark:border-gray-700'>
          <h1 className='font-bold text-xl dark:text-gray-100'>{user?.username || 'Your Chats'}</h1>
          {totalUnread > 0 && (
            <span className='bg-blue-500 text-white text-xs rounded-full px-2 py-0.5'>{totalUnread}</span>
          )}
        </div>
        <div className='overflow-y-auto h-[80vh]'>
          {chatUsers && chatUsers.length > 0 ? (
            chatUsers.map((chatUser) => {
              const isOnline = onlineUsers.includes(chatUser._id);
              const unread = unreadCounts[chatUser._id] || 0;
              return (
                <div
                  key={chatUser._id}
                  onClick={() => dispatch(setSelectedUser(chatUser))}
                  className={`flex gap-3 items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b dark:border-gray-700 ${
                    selectedUser?._id === chatUser._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className='relative'>
                    <div className='w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700'>
                      {chatUser.profilePicture ? (
                        <img src={chatUser.profilePicture} alt={chatUser.username} className='w-full h-full object-cover' />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400'>
                          {(chatUser.username?.charAt(0) || 'U').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${isOnline ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-500'}`} />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <span className='font-medium text-sm block truncate dark:text-gray-100'>{chatUser.username}</span>
                    <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                      {isOnline ? 'online' : getLastSeenText(chatUser._id)}
                    </span>
                  </div>
                  {unread > 0 && (
                    <span className='bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                      {unread}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className='p-4 text-center text-gray-500 dark:text-gray-400'>No users available.</div>
          )}
        </div>
      </section>

      {/* Chat Area — full width on mobile, flex-1 on desktop */}
      {selectedUser ? (
        <section className={`${selectedUser ? 'flex' : 'hidden md:flex'} w-full md:w-auto flex-1 flex-col h-full bg-white dark:bg-gray-900 md:rounded-lg shadow-sm dark:shadow-gray-900/20 md:ml-4`}>
          {/* Header with back button (mobile) + call buttons */}
          <div className='flex items-center justify-between px-3 md:px-4 py-3 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10'>
            <div className='flex gap-2 md:gap-3 items-center'>
              {/* Back button — mobile only */}
              <button
                onClick={() => dispatch(setSelectedUser(null))}
                className='md:hidden p-1 -ml-1 text-gray-600 dark:text-gray-300'
              >
                <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='m15 18-6-6 6-6'/></svg>
              </button>
              <div className='w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700'>
                {selectedUser.profilePicture ? (
                  <img src={selectedUser.profilePicture} alt={selectedUser.username} className='w-full h-full object-cover' />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400'>
                    {(selectedUser.username?.charAt(0) || 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <span className='font-medium block dark:text-gray-100'>{selectedUser.username}</span>
                <span className={`text-xs ${isSelectedOnline ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                  {isSelectedOnline ? 'online' : getLastSeenText(selectedUser._id)}
                </span>
              </div>
            </div>
            {/* Call buttons */}
            <div className='flex items-center gap-1 md:gap-2'>
              <button
                onClick={() => handleCallStart('audio')}
                disabled={!isSelectedOnline}
                className='p-1.5 md:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors'
                title='Audio call'
              >
                <Phone className='w-[18px] h-[18px] md:w-5 md:h-5 text-gray-600 dark:text-gray-300' />
              </button>
              <button
                onClick={() => handleCallStart('video')}
                disabled={!isSelectedOnline}
                className='p-1.5 md:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors'
                title='Video call'
              >
                <Video className='w-[18px] h-[18px] md:w-5 md:h-5 text-gray-600 dark:text-gray-300' />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className='flex-1 overflow-y-auto p-4 space-y-3'>
            {messages && messages.length > 0 ? (
              messages.map((msg, index) => {
                const isSender = msg.senderId === user?._id;
                const isActionsVisible = activeMessageId === msg._id;
                return (
                  <div
                    key={msg._id || `message-${index}`}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className='max-w-xs relative'>
                      {/* Reply context */}
                      {msg.replyTo && (
                        <div className={`text-xs px-2 py-1 rounded-t-lg mb-0.5 ${
                          isSender ? 'bg-blue-400/50 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          <Reply size={10} className='inline mr-1' />
                          {msg.replyTo.message?.slice(0, 40) || (msg.replyTo.messageType === 'image' ? 'Photo' : 'Voice message')}
                        </div>
                      )}

                      {/* Story reply */}
                      {msg.storyReply && (
                        <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-1`}>
                          <div className='relative'>
                            <img src={msg.storyReply.storyImage} alt='story' className='w-16 h-24 rounded-lg object-cover opacity-70' />
                            <span className='absolute bottom-1 left-1 text-white text-[10px] bg-black/40 rounded px-1'>Story reply</span>
                          </div>
                        </div>
                      )}

                      {/* Message content - tap/long-press to show actions */}
                      <div
                        data-msg-bubble
                        className={`rounded-lg py-2 px-3 select-none ${isSender ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-100'}`}
                        onClick={() => handleMessageClick(msg._id)}
                        onTouchStart={() => handleMessageTouchStart(msg._id)}
                        onTouchEnd={handleMessageTouchEnd}
                        onTouchMove={handleMessageTouchEnd}
                      >
                        {msg.messageType === 'image' && msg.imageUrl && (
                          <img src={msg.imageUrl} alt='shared' className='rounded-lg max-w-full mb-1' />
                        )}
                        {msg.messageType === 'voice' && msg.voiceUrl && (
                          <div className='flex items-center gap-2'>
                            <audio src={msg.voiceUrl} controls className='h-8 max-w-[200px]' />
                            {msg.voiceDuration && (
                              <span className='text-xs opacity-70'>{msg.voiceDuration}s</span>
                            )}
                          </div>
                        )}
                        {msg.message && <span>{msg.message}</span>}

                        {/* Read receipt */}
                        {isSender && (
                          <span className='float-right ml-2 mt-1'>
                            {msg.read ? (
                              <CheckCheck size={14} className='text-blue-200' />
                            ) : (
                              <Check size={14} className='text-white/50' />
                            )}
                          </span>
                        )}
                      </div>

                      {/* Reactions display */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className='flex gap-0.5 mt-0.5'>
                          {msg.reactions.map((r, i) => (
                            <span key={i} className='text-sm bg-white dark:bg-gray-900 rounded-full shadow-sm dark:shadow-gray-900/20 px-1 border dark:border-gray-700'>
                              {r.emoji}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons - visible on hover (desktop) OR tap/long-press (mobile) */}
                      <div
                        data-msg-actions
                        className={`absolute top-0 ${isSender ? '-left-24' : '-right-24'} gap-1 ${
                          isActionsVisible ? 'flex' : 'hidden group-hover:flex'
                        }`}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); setReplyTo(msg); setActiveMessageId(null); }}
                          className='p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 dark:text-gray-200'
                          title='Reply'
                        >
                          <Reply size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowEmojiFor(showEmojiFor === msg._id ? null : msg._id); }}
                          className='p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 dark:text-gray-200'
                          title='React'
                        >
                          <Smile size={14} />
                        </button>
                        {isSender && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUnsend(msg._id); setActiveMessageId(null); }}
                            className='p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 text-red-500'
                            title='Unsend'
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Emoji picker */}
                      {showEmojiFor === msg._id && (
                        <div
                          data-msg-actions
                          className={`absolute ${isSender ? 'right-0' : 'left-0'} -top-10 bg-white dark:bg-gray-800 rounded-full shadow-lg border dark:border-gray-700 px-2 py-1 flex gap-1 z-20`}
                        >
                          {EMOJI_LIST.map(emoji => (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); handleReact(msg._id, emoji); setActiveMessageId(null); }}
                              className='hover:scale-125 active:scale-110 transition-transform text-lg p-0.5'
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className='p-4 text-center text-gray-500 dark:text-gray-400'>No messages yet. Start the conversation!</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing indicator */}
          {isSelectedUserTyping && (
            <div className='px-4 py-1'>
              <span className='text-xs text-gray-400 dark:text-gray-500 italic'>typing...</span>
            </div>
          )}

          {/* Reply preview */}
          {replyTo && (
            <div className='flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-950 border-t dark:border-gray-700'>
              <div className='flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400'>
                <Reply size={14} />
                <span className='truncate max-w-[200px]'>
                  {replyTo.message || (replyTo.messageType === 'image' ? 'Photo' : 'Voice message')}
                </span>
              </div>
              <button onClick={() => setReplyTo(null)}>
                <X size={16} className='text-gray-400 dark:text-gray-500' />
              </button>
            </div>
          )}

          {/* Input area */}
          <div className='flex items-center gap-2 p-4 border-t dark:border-gray-700'>
            {/* Image upload */}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && selectedUser) {
                  sendImage(selectedUser._id, file);
                  e.target.value = '';
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className='p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
              title='Send image'
            >
              <Image size={20} />
            </button>

            {/* Voice recording */}
            {isRecording ? (
              <div className='flex-1 flex items-center gap-3'>
                <div className='flex items-center gap-2 flex-1'>
                  <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse' />
                  <span className='text-sm text-red-500 font-medium'>
                    {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                  </span>
                </div>
                <button
                  onClick={stopRecording}
                  className='bg-red-500 text-white p-2 rounded-full'
                  title='Stop & send'
                >
                  <Send size={18} />
                </button>
              </div>
            ) : (
              <>
                <input
                  value={textMessage}
                  onChange={(e) => { setTextMessage(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => selectedUser && e.key === 'Enter' && sendMessageHandler(selectedUser._id)}
                  type='text'
                  className='flex-1 p-2 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100'
                  placeholder='Type a message...'
                />

                {textMessage.trim() ? (
                  <button
                    onClick={() => selectedUser && sendMessageHandler(selectedUser._id)}
                    className='bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50'
                  >
                    <Send size={18} />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className='p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                    title='Voice message'
                  >
                    <Mic size={20} />
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      ) : (
        <div className='hidden md:flex flex-1 flex-col items-center justify-center mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/20 ml-4'>
          <MessageCircle className='w-32 h-32 my-4 text-gray-300 dark:text-gray-600' />
          <h1 className='font-medium text-xl text-gray-700 dark:text-gray-200'>Your messages</h1>
          <span className='text-gray-500 dark:text-gray-400'>Send a message to start a chat.</span>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
