import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  User, Minimize2, Maximize2
} from 'lucide-react';
import { RootState } from '@/redux/store';
import { endCall, setInCall, toggleMute, toggleCamera } from '@/redux/callSlice';
import { useCallEvents } from '@/hooks/useCallEvents';

const CallOverlay: React.FC = () => {
  const dispatch = useDispatch();
  const { callStatus, callType, peer, isMuted, isCameraOff, callStartTime } = useSelector(
    (store: RootState) => store.call
  );
  const { socket } = useSelector((store: RootState) => store.socketio);
  const user = useSelector((store: RootState) => store.auth.user);
  const { webrtc, stopRingtone } = useCallEvents();
  const [callDuration, setCallDuration] = useState('00:00');
  const [isMinimized, setIsMinimized] = useState(false);
  const localPreviewStarted = useRef(false);

  // Call timer
  useEffect(() => {
    if (callStatus !== 'in-call' || !callStartTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      setCallDuration(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus, callStartTime]);

  // Start local camera preview when calling/ringing with video
  useEffect(() => {
    if (callType === 'video' && (callStatus === 'calling' || callStatus === 'ringing') && !localPreviewStarted.current) {
      localPreviewStarted.current = true;
      webrtc.getMedia('video').then(stream => {
        if (stream && webrtc.localVideoRef.current) {
          webrtc.localVideoRef.current.srcObject = stream;
        }
      });
    }
    if (callStatus === 'idle') {
      localPreviewStarted.current = false;
    }
  }, [callStatus, callType, webrtc]);

  // Re-assign local stream to video element when call state changes (ref switches between elements)
  useEffect(() => {
    if (webrtc.localVideoRef.current && webrtc.localStreamRef?.current) {
      webrtc.localVideoRef.current.srcObject = webrtc.localStreamRef.current;
    }
  }, [callStatus, webrtc]);

  if (callStatus === 'idle' || !peer) return null;

  const handleAccept = async () => {
    stopRingtone();
    if (!localPreviewStarted.current) {
      await webrtc.getMedia(callType);
    }
    dispatch(setInCall());
    if (socket) {
      (socket as any).emit('call:accept', { to: peer._id, from: user?._id });
    }
  };

  const handleReject = () => {
    stopRingtone();
    if (socket) {
      (socket as any).emit('call:reject', { to: peer._id });
    }
    webrtc.cleanup();
    dispatch(endCall());
  };

  const handleEnd = () => {
    stopRingtone();
    if (socket) {
      (socket as any).emit('call:end', { to: peer._id });
    }
    webrtc.cleanup();
    dispatch(endCall());
  };

  const handleToggleMute = () => {
    dispatch(toggleMute());
    webrtc.toggleMuteTrack(!isMuted);
  };

  const handleToggleCamera = () => {
    dispatch(toggleCamera());
    webrtc.toggleCameraTrack(!isCameraOff);
  };

  // ============ MINIMIZED PiP MODE ============
  if (isMinimized && callStatus === 'in-call') {
    return (
      <div
        className='fixed bottom-4 right-4 z-[100] cursor-pointer group'
        onClick={() => setIsMinimized(false)}
      >
        {callType === 'video' ? (
          <div className='relative w-40 h-56 sm:w-48 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20'>
            <video
              ref={webrtc.remoteVideoRef}
              autoPlay
              playsInline
              className='w-full h-full object-cover mirror-video'
            />
            <video
              ref={webrtc.localVideoRef}
              autoPlay
              muted
              playsInline
              className='absolute bottom-2 right-2 w-14 h-20 rounded-lg object-cover border border-white/50 mirror-video'
            />
            <div className='absolute top-2 left-2 bg-black/50 rounded-full px-2 py-0.5'>
              <span className='text-white text-[10px]'>{callDuration}</span>
            </div>
            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center'>
              <Maximize2 size={20} className='text-white opacity-0 group-hover:opacity-100 transition-opacity' />
            </div>
          </div>
        ) : (
          <div className='flex items-center gap-3 bg-green-600 rounded-full px-4 py-3 shadow-2xl'>
            <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-700'>
              {peer.profilePicture ? (
                <img src={peer.profilePicture} alt='' className='w-full h-full object-cover' />
              ) : (
                <div className='w-full h-full flex items-center justify-center'>
                  <User size={18} className='text-gray-300' />
                </div>
              )}
            </div>
            <div>
              <p className='text-white text-sm font-medium'>{peer.username}</p>
              <p className='text-white/70 text-xs'>{callDuration}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleEnd(); }}
              className='ml-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center'
            >
              <PhoneOff size={14} className='text-white' />
            </button>
          </div>
        )}
        {/* Hidden audio for audio calls in PiP */}
        {callType === 'audio' && (
          <audio ref={webrtc.remoteVideoRef as any} autoPlay className='hidden' />
        )}
      </div>
    );
  }

  // ============ FULL-SCREEN MODE ============
  return (
    <div className='fixed inset-0 z-[100] bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col'>
      {/* Top bar */}
      <div className='flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 z-20'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-700'>
            {peer.profilePicture ? (
              <img src={peer.profilePicture} alt='' className='w-full h-full object-cover' />
            ) : (
              <div className='w-full h-full flex items-center justify-center'>
                <User size={16} className='text-gray-300' />
              </div>
            )}
          </div>
          <div>
            <p className='text-white text-sm sm:text-base font-semibold'>{peer.username}</p>
            <p className='text-white/50 text-xs'>
              {callStatus === 'calling' && 'Calling...'}
              {callStatus === 'ringing' && `Incoming ${callType} call`}
              {callStatus === 'in-call' && callDuration}
            </p>
          </div>
        </div>
        {callStatus === 'in-call' && (
          <button
            onClick={() => setIsMinimized(true)}
            className='p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors'
            title='Minimize'
          >
            <Minimize2 size={18} className='text-white' />
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className='flex-1 flex items-center justify-center relative overflow-hidden'>
        {/* Video call - in call */}
        {callStatus === 'in-call' && callType === 'video' && (
          <>
            <video
              ref={webrtc.remoteVideoRef}
              autoPlay
              playsInline
              className='absolute inset-0 w-full h-full object-cover mirror-video'
            />
            {/* Local video PiP */}
            <video
              ref={webrtc.localVideoRef}
              autoPlay
              muted
              playsInline
              className='absolute bottom-4 right-4 w-24 h-36 sm:w-32 sm:h-44 md:w-36 md:h-48 rounded-xl object-cover border-2 border-white/30 shadow-2xl z-10 mirror-video'
            />
          </>
        )}

        {/* Video call - calling/ringing (show local camera preview as background) */}
        {callType === 'video' && (callStatus === 'calling' || callStatus === 'ringing') && (
          <>
            <video
              ref={webrtc.localVideoRef}
              autoPlay
              muted
              playsInline
              className='absolute inset-0 w-full h-full object-cover opacity-30 blur-sm mirror-video'
            />
            <div className='absolute inset-0 bg-black/40' />
          </>
        )}

        {/* Profile display (calling/ringing for both types, audio in-call) */}
        {(callStatus !== 'in-call' || callType === 'audio') && (
          <div className='flex flex-col items-center z-10 px-4'>
            {/* Profile picture with animated ring */}
            <div className={`relative mb-6 sm:mb-8 ${
              callStatus === 'ringing' ? 'animate-bounce-slow' : ''
            }`}>
              {/* Pulse rings */}
              {(callStatus === 'calling' || callStatus === 'ringing') && (
                <>
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                    callStatus === 'ringing' ? 'bg-green-400' : 'bg-blue-400'
                  }`} style={{ animationDuration: '2s' }} />
                  <div className={`absolute -inset-3 rounded-full animate-pulse opacity-10 ${
                    callStatus === 'ringing' ? 'bg-green-400' : 'bg-blue-400'
                  }`} />
                </>
              )}
              <div className={`w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden ring-4 ${
                callStatus === 'ringing' ? 'ring-green-400' :
                callStatus === 'calling' ? 'ring-blue-400' :
                'ring-white/20'
              }`}>
                {peer.profilePicture ? (
                  <img src={peer.profilePicture} alt='' className='w-full h-full object-cover' />
                ) : (
                  <div className='w-full h-full bg-gray-700 flex items-center justify-center'>
                    <User size={48} className='text-gray-400' />
                  </div>
                )}
              </div>
            </div>

            <h2 className='text-white text-xl sm:text-2xl md:text-3xl font-semibold mb-1'>{peer.username}</h2>
            <p className='text-white/50 text-sm sm:text-base'>
              {callStatus === 'calling' && 'Calling...'}
              {callStatus === 'ringing' && `Incoming ${callType} call`}
              {callStatus === 'in-call' && callDuration}
            </p>

            {/* Encrypted badge */}
            <div className='mt-4 flex items-center gap-1.5 text-white/30 text-xs'>
              <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z' clipRule='evenodd' />
              </svg>
              End-to-end encrypted
            </div>
          </div>
        )}

        {/* Hidden audio element for audio calls */}
        {callType === 'audio' && (
          <audio ref={webrtc.remoteVideoRef as any} autoPlay className='hidden' />
        )}
      </div>

      {/* Controls bar */}
      <div className='pb-8 sm:pb-12 pt-4 px-4 z-20'>
        <div className='flex items-center justify-center gap-4 sm:gap-6'>
          {/* Ringing: Reject + Accept */}
          {callStatus === 'ringing' && (
            <>
              <div className='flex flex-col items-center gap-2'>
                <button
                  onClick={handleReject}
                  className='w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30'
                >
                  <PhoneOff className='text-white' size={24} />
                </button>
                <span className='text-white/50 text-xs'>Decline</span>
              </div>
              <div className='flex flex-col items-center gap-2'>
                <button
                  onClick={handleAccept}
                  className='w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/30'
                >
                  <Phone className='text-white' size={24} />
                </button>
                <span className='text-white/50 text-xs'>Accept</span>
              </div>
            </>
          )}

          {/* Calling: End */}
          {callStatus === 'calling' && (
            <div className='flex flex-col items-center gap-2'>
              <button
                onClick={handleEnd}
                className='w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30'
              >
                <PhoneOff className='text-white' size={24} />
              </button>
              <span className='text-white/50 text-xs'>Cancel</span>
            </div>
          )}

          {/* In-call controls */}
          {callStatus === 'in-call' && (
            <>
              <div className='flex flex-col items-center gap-1.5'>
                <button
                  onClick={handleToggleMute}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-lg ${
                    isMuted ? 'bg-red-500 shadow-red-500/30' : 'bg-white/15 hover:bg-white/25'
                  }`}
                >
                  {isMuted ? <MicOff className='text-white' size={20} /> : <Mic className='text-white' size={20} />}
                </button>
                <span className='text-white/40 text-[10px]'>{isMuted ? 'Unmute' : 'Mute'}</span>
              </div>

              {callType === 'video' && (
                <div className='flex flex-col items-center gap-1.5'>
                  <button
                    onClick={handleToggleCamera}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-lg ${
                      isCameraOff ? 'bg-red-500 shadow-red-500/30' : 'bg-white/15 hover:bg-white/25'
                    }`}
                  >
                    {isCameraOff ? <VideoOff className='text-white' size={20} /> : <Video className='text-white' size={20} />}
                  </button>
                  <span className='text-white/40 text-[10px]'>{isCameraOff ? 'Camera on' : 'Camera off'}</span>
                </div>
              )}

              <div className='flex flex-col items-center gap-1.5'>
                <button
                  onClick={handleEnd}
                  className='w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30'
                >
                  <PhoneOff className='text-white' size={20} />
                </button>
                <span className='text-white/40 text-[10px]'>End</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom animation */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CallOverlay;
