import { useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = () => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const { socket } = useSelector((store: RootState) => store.socketio);

  const getMedia = useCallback(async (callType: 'audio' | 'video'): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = callType === 'video'
        ? { video: true, audio: true }
        : { audio: true };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback to audio only if video fails
        if (callType === 'video') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          throw new Error('Could not access microphone');
        }
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Failed to get media:', error);
      return null;
    }
  }, []);

  const initPeerConnection = useCallback((peerId: string, onRemoteStream: (stream: MediaStream) => void) => {
    const pc = new RTCPeerConnection(ICE_CONFIG);
    peerConnectionRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      onRemoteStream(remoteStream);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        (socket as any).emit('webrtc:ice-candidate', {
          to: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.log('ICE connection failed/disconnected');
      }
    };

    return pc;
  }, [socket]);

  const createOffer = useCallback(async (peerId: string, onRemoteStream: (stream: MediaStream) => void) => {
    const pc = initPeerConnection(peerId, onRemoteStream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (socket) {
      (socket as any).emit('webrtc:offer', { to: peerId, offer });
    }
  }, [socket, initPeerConnection]);

  const handleOffer = useCallback(async (
    peerId: string,
    offer: RTCSessionDescriptionInit,
    onRemoteStream: (stream: MediaStream) => void
  ) => {
    const pc = initPeerConnection(peerId, onRemoteStream);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (socket) {
      (socket as any).emit('webrtc:answer', { to: peerId, answer });
    }
  }, [socket, initPeerConnection]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  }, []);

  const toggleMuteTrack = useCallback((muted: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }, []);

  const toggleCameraTrack = useCallback((off: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !off;
      });
    }
  }, []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    localStreamRef,
    remoteStreamRef,
    getMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    toggleMuteTrack,
    toggleCameraTrack,
    cleanup,
  };
};
