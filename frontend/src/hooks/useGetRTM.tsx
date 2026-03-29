import { addMessage, incrementUnread } from "../redux/chatSlice";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { toast } from "sonner";
import { setSelectedUser } from "../redux/authSlice";
import type { Message } from "../types";

const useGetRTM = (): void => {
    const dispatch = useDispatch();
    const { socket } = useSelector((store: RootState) => store.socketio);
    const selectedUser = useSelector((store: RootState) => store.auth?.selectedUser);
    const selectedUserRef = useRef(selectedUser);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        if (!socket) return;
        const s = socket as any;

        const handleNewMessage = (newMessage: Message): void => {
            if (selectedUserRef.current?._id === newMessage.senderId) {
                dispatch(addMessage(newMessage));
            } else {
                // Increment unread count for this sender
                dispatch(incrementUnread(newMessage.senderId));

                // Build message preview
                const msgPreview = newMessage.messageType === 'image' ? 'Sent a photo'
                  : newMessage.messageType === 'voice' ? 'Sent a voice message'
                  : newMessage.message?.slice(0, 60) + (newMessage.message?.length > 60 ? '...' : '');

                const senderName = newMessage.senderInfo?.username || 'Someone';
                const senderPic = newMessage.senderInfo?.profilePicture;

                // Instagram-style message notification
                toast.custom(
                  (id) => (
                    <div
                      onClick={() => {
                        // Navigate to chat with this user
                        dispatch(setSelectedUser({
                          _id: newMessage.senderId,
                          username: senderName,
                          profilePicture: senderPic,
                        } as any));
                        window.location.href = '/chat';
                        toast.dismiss(id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                        cursor: 'pointer',
                        width: '100%',
                        maxWidth: '380px',
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      {/* Sender avatar */}
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {senderPic ? (
                          <img
                            src={senderPic}
                            alt={senderName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: '18px' }}>
                            {senderName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Message info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          color: '#1a1a1a',
                          marginBottom: '2px',
                        }}>
                          {senderName}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {msgPreview}
                        </div>
                      </div>

                      {/* Badge */}
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        flexShrink: 0,
                      }} />
                    </div>
                  ),
                  {
                    duration: 4000,
                    position: 'top-right',
                  }
                );
            }
        };

        s.on('newMessage', handleNewMessage);

        return () => {
            s.off('newMessage', handleNewMessage);
        };
    }, [socket, dispatch]);
};

export default useGetRTM;
