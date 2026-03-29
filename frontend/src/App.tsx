import React, { useEffect } from 'react';
import './App.css';
import ChatPage from './components/ChatPage';
import EditProfile from './components/EditProfile';
import Home from './pages/Home';
import Login from './pages/Login';
import MainLayout from './pages/MainLayout';
import Profile from './components/Profile';
import Explore from './pages/Explore';
import Signup from './pages/Signup';
import SavedPosts from './pages/SavedPosts';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import SuggestedUsersPage from './pages/SuggestedUsersPage';
import CallOverlay from './components/CallOverlay';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { setOnlineUsers } from './redux/chatSlice';
import { setLikeNotification, LikeNotification } from './redux/rtnSlice';
import { setSocket } from './redux/socketSlice';
import { setUnreadCount, addNotification } from './redux/notificationSlice';
import { setAuthUser, setToken } from './redux/authSlice';
import API from './lib/api';
import ProtectedRoutes from './routes/ProtectedRoutes';
import useSocketEvents from './hooks/useSocketEvents';
import useGetRTM from './hooks/useGetRTM';
import { RootState, store } from './redux/store';

const browserRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoutes>
        <MainLayout />
      </ProtectedRoutes>
    ),
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/home',
        element: <Home />,
      },
      {
        path: '/profile/:id',
        element: <Profile />,
      },
      {
        path: '/account/edit',
        element: <EditProfile />,
      },
      {
        path: '/chat',
        element: <ChatPage />,
      },
      {
        path: '/explore',
        element: <Explore />,
      },
      {
        path: '/saved',
        element: <SavedPosts />,
      },
      {
        path: '/suggested',
        element: <SuggestedUsersPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/verify-otp',
    element: <VerifyOTP />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
]);

const App: React.FC = () => {
  const { user } = useSelector((store: RootState) => store.auth);
  const dispatch = useDispatch();
  useSocketEvents();
  useGetRTM();

  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const token = store.getState().auth.token;
    const socketio: Socket = io(socketUrl, {
      query: { userId },
      auth: { token }, // pass JWT for socket authentication
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      withCredentials: true,
      forceNew: true,
    });

    dispatch(setSocket(socketio as any));

    socketio.on('getOnlineUsers', (onlineUsers: string[]) => {
      dispatch(setOnlineUsers(onlineUsers));
    });

    // Handle socket auth errors (expired token on reconnect)
    socketio.on('connect_error', async (err) => {
      if (err.message === 'Token expired' || err.message === 'Invalid token' || err.message === 'Authentication required') {
        try {
          const res = await API.post('/users/refresh');
          if (res.data.accessToken) {
            dispatch(setToken(res.data.accessToken));
            socketio.auth = { token: res.data.accessToken };
          }
          socketio.connect(); // retry with new token
        } catch {
          dispatch(setToken(null));
          dispatch(setAuthUser(null));
        }
      }
    });

    socketio.on('notification', (notification: any) => {
      dispatch(setLikeNotification(notification as LikeNotification));
      if (notification._id) {
        dispatch(addNotification(notification));
      }
      dispatch(setUnreadCount(0));
    });

    // Fetch unread notification count
    API.get('/notifications/unread-count').then(res => {
      if (res.data.success) {
        dispatch(setUnreadCount(res.data.count));
      }
    }).catch(() => {});

    return () => {
      socketio.close();
      dispatch(setSocket(null));
    };
  }, [userId, dispatch]);

  return (
    <>
      <RouterProvider router={browserRouter} />
      <CallOverlay />
    </>
  );
};

export default App;
