import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Send, X, Minus, ChevronLeft, User as UserIcon, Check, CheckCheck } from 'lucide-react';
import { RootState } from '../redux/store';
import { clearUnread } from '../redux/chatSlice';
import API from '../lib/api';
import type { User, Message } from '../types';

type View = 'closed' | 'list' | 'chat';

const FloatingChat: React.FC = () => {
  const [view, setView] = useState<View>('closed');
  const [chatUsers, setChatUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector((store: RootState) => store.auth?.user);
  const onlineUsers = useSelector((store: RootState) => store.chat?.onlineUsers || []);
  const unreadCounts = useSelector((store: RootState) => store.chat?.unreadCounts || {});
  const socket = useSelector((store: RootState) => store.socketio?.socket);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const isOnChatPage = location.pathname === '/chat';

  // Fetch chat users when list opens
  useEffect(() => {
    if (view === 'list') {
      API.get('/users/chat-users').then(res => {
        if (res.data.success) setChatUsers(res.data.users || []);
      }).catch(() => {});
    }
  }, [view]);

  // Fetch messages when a chat opens
  useEffect(() => {
    if (!activeUser) return;
    setLoading(true);
    API.get(`/message/all/${activeUser._id}`).then(res => {
      if (res.data.success) {
        setMessages(res.data.messages?.slice(-30) || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));

    // Mark as read
    dispatch(clearUnread(activeUser._id));
    API.put(`/message/conversation/${activeUser._id}/read`).catch(() => {});
  }, [activeUser?._id, dispatch]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket || !activeUser) return;
    const s = socket as any;

    const handleNewMessage = (msg: Message) => {
      if (msg.senderId === activeUser._id || msg.senderId === user?._id) {
        setMessages(prev => [...prev, msg]);
        if (msg.senderId === activeUser._id) {
          dispatch(clearUnread(activeUser._id));
          API.put(`/message/conversation/${activeUser._id}/read`).catch(() => {});
        }
      }
    };

    s.on('newMessage', handleNewMessage);
    return () => { s.off('newMessage', handleNewMessage); };
  }, [socket, activeUser?._id, user?._id, dispatch]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = (chatUser: User) => {
    setActiveUser(chatUser);
    setMessages([]);
    setView('chat');
  };

  const sendMessage = async () => {
    if (!text.trim() || !activeUser) return;
    try {
      const formData = new FormData();
      formData.append('textMessage', text);
      formData.append('messageType', 'text');
      const res = await API.post(`/message/send/${activeUser._id}`, formData);
      if (res.data.success && res.data.newMessage) {
        setMessages(prev => [...prev, res.data.newMessage]);
        setText('');
      }
    } catch {}
  };

  const isOnline = (userId: string) => onlineUsers.includes(userId);

  // Hide on /chat page (after all hooks)
  if (isOnChatPage) return null;

  return (
    <div className='hidden md:block fixed bottom-6 right-6 z-40'>
      {/* ─── Mini Chat Window ─── */}
      {view === 'chat' && activeUser && (
        <div className='w-80 h-[28rem] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden mb-3 animate-[slideUp_0.2s_ease-out]'>
          {/* Header */}
          <div className='bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5 flex items-center justify-between flex-shrink-0'>
            <div className='flex items-center gap-2'>
              <button onClick={() => { setView('list'); setActiveUser(null); }} className='text-white/80 hover:text-white'>
                <ChevronLeft size={18} />
              </button>
              <div className='relative'>
                <div className='w-8 h-8 rounded-full overflow-hidden bg-blue-400'>
                  {activeUser.profilePicture ? (
                    <img src={activeUser.profilePicture} alt='' className='w-full h-full object-cover' />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-white text-sm font-semibold'>
                      {activeUser.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {isOnline(activeUser._id) && (
                  <div className='absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-blue-600' />
                )}
              </div>
              <div>
                <p className='text-white text-sm font-semibold leading-tight'>{activeUser.username}</p>
                <p className='text-blue-100 text-[11px]'>{isOnline(activeUser._id) ? 'Active now' : 'Offline'}</p>
              </div>
            </div>
            <div className='flex items-center gap-1'>
              <button onClick={() => setView('closed')} className='text-white/70 hover:text-white p-1'>
                <Minus size={16} />
              </button>
              <button onClick={() => { setView('closed'); setActiveUser(null); }} className='text-white/70 hover:text-white p-1'>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className='flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-950'>
            {loading ? (
              <div className='flex justify-center py-8'>
                <div className='w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin' />
              </div>
            ) : messages.length === 0 ? (
              <div className='text-center py-8 text-gray-400 dark:text-gray-500 text-sm'>
                Send a message to start chatting
              </div>
            ) : (
              messages.map((msg, i) => {
                const isSender = msg.senderId === user?._id;
                return (
                  <div key={msg._id || i} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-sm ${
                      isSender
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                    }`}>
                      {msg.messageType === 'image' && msg.imageUrl && (
                        <img src={msg.imageUrl} alt='' className='rounded-lg max-w-full mb-1' />
                      )}
                      {msg.message && <span>{msg.message}</span>}
                      {isSender && (
                        <span className='inline-block ml-1.5 align-bottom'>
                          {msg.read
                            ? <CheckCheck size={12} className='text-blue-200' />
                            : <Check size={12} className='text-white/50' />
                          }
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className='p-2 border-t dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-2 flex-shrink-0'>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder='Aa'
              className='flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-400'
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim()}
              className='p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors'
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Chat User List ─── */}
      {view === 'list' && (
        <div className='w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-3 animate-[slideUp_0.2s_ease-out]'>
          {/* Header */}
          <div className='px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between'>
            <h3 className='font-semibold text-gray-800 dark:text-gray-100'>Messages</h3>
            <button onClick={() => setView('closed')} className='text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'>
              <X size={18} />
            </button>
          </div>

          {/* User List */}
          <div className='max-h-80 overflow-y-auto'>
            {chatUsers.length === 0 ? (
              <div className='p-4 text-center text-gray-400 dark:text-gray-500 text-sm'>No conversations yet</div>
            ) : (
              chatUsers.map((chatUser) => {
                const online = isOnline(chatUser._id);
                const unread = unreadCounts[chatUser._id] || 0;
                return (
                  <button
                    key={chatUser._id}
                    onClick={() => openChat(chatUser)}
                    className='w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left'
                  >
                    <div className='relative flex-shrink-0'>
                      <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700'>
                        {chatUser.profilePicture ? (
                          <img src={chatUser.profilePicture} alt='' className='w-full h-full object-cover' />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500'>
                            <UserIcon size={18} />
                          </div>
                        )}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${online ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
                        {chatUser.username}
                      </p>
                      <p className={`text-xs ${online ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                        {online ? 'Active now' : 'Offline'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className='w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0'>
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── Chat Bubble Button ─── */}
      <button
        onClick={() => setView(view === 'closed' ? 'list' : 'closed')}
        className='w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 relative'
      >
        {view === 'closed' ? (
          <MessageCircle size={24} />
        ) : (
          <X size={24} />
        )}
        {totalUnread > 0 && view === 'closed' && (
          <span className='absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1'>
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* Animation keyframe */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FloatingChat;
