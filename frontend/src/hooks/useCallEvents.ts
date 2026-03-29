import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { setIncomingCall, setInCall, endCall } from '../redux/callSlice';
import { toast } from 'sonner';
import { useWebRTC } from './useWebRTC';

export const useCallEvents = () => {
  const dispatch = useDispatch();
  const { socket } = useSelector((store: RootState) => store.socketio);
  const callState = useSelector((store: RootState) => store.call);
  const callStateRef = useRef(callState);
  const ringtoneRef = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode; interval: NodeJS.Timeout } | null>(null);

  const webrtc = useWebRTC();
  const webrtcRef = useRef(webrtc);

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { webrtcRef.current = webrtc; }, [webrtc]);

  const startRingtone = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 440;
      osc.type = 'sine';
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      const interval = setInterval(() => {
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.4);
      }, 800);

      ringtoneRef.current = { ctx, osc, gain, interval };
    } catch {
      // Audio context not available
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current.interval);
      ringtoneRef.current.osc.stop();
      ringtoneRef.current.ctx.close();
      ringtoneRef.current = null;
    }
  }, []);

  const handleRemoteStream = useCallback(() => {
    // Remote stream is handled by refs in useWebRTC
  }, []);

  useEffect(() => {
    if (!socket) return;
    const s = socket as any;

    const onIncoming = ({ callerInfo, callType }: any) => {
      dispatch(setIncomingCall({ peer: callerInfo, callType }));
      startRingtone();
    };

    const onAccepted = async () => {
      const w = webrtcRef.current;
      const cs = callStateRef.current;
      if (!cs.peer) return;

      const stream = await w.getMedia(cs.callType);
      if (stream) {
        await w.createOffer(cs.peer._id, handleRemoteStream);
        dispatch(setInCall());
      }
    };

    const onRejected = () => {
      stopRingtone();
      webrtcRef.current.cleanup();
      dispatch(endCall());
      toast.info('Call declined');
    };

    const onEnded = () => {
      stopRingtone();
      webrtcRef.current.cleanup();
      dispatch(endCall());
      toast.info('Call ended');
    };

    const onBusy = () => {
      dispatch(endCall());
      toast.info('User is busy');
    };

    const onOffline = () => {
      dispatch(endCall());
      toast.info('User is offline');
    };

    const onMissed = () => {
      stopRingtone();
      webrtcRef.current.cleanup();
      dispatch(endCall());
      toast.info('No answer');
    };

    const onTimeout = () => {
      stopRingtone();
      dispatch(endCall());
    };

    const onOffer = async ({ from, offer }: any) => {
      const w = webrtcRef.current;
      const cs = callStateRef.current;
      // Accept offer if in-call OR ringing (offer can arrive before Redux updates)
      if (cs.callStatus !== 'in-call' && cs.callStatus !== 'ringing') return;
      await w.handleOffer(from, offer, handleRemoteStream);
    };

    const onAnswer = async ({ answer }: any) => {
      await webrtcRef.current.handleAnswer(answer);
    };

    const onIce = async ({ candidate }: any) => {
      await webrtcRef.current.handleIceCandidate(candidate);
    };

    s.on('call:incoming', onIncoming);
    s.on('call:accepted', onAccepted);
    s.on('call:rejected', onRejected);
    s.on('call:ended', onEnded);
    s.on('call:busy', onBusy);
    s.on('call:user-offline', onOffline);
    s.on('call:missed', onMissed);
    s.on('call:timeout', onTimeout);
    s.on('webrtc:offer', onOffer);
    s.on('webrtc:answer', onAnswer);
    s.on('webrtc:ice-candidate', onIce);

    return () => {
      s.off('call:incoming', onIncoming);
      s.off('call:accepted', onAccepted);
      s.off('call:rejected', onRejected);
      s.off('call:ended', onEnded);
      s.off('call:busy', onBusy);
      s.off('call:user-offline', onOffline);
      s.off('call:missed', onMissed);
      s.off('call:timeout', onTimeout);
      s.off('webrtc:offer', onOffer);
      s.off('webrtc:answer', onAnswer);
      s.off('webrtc:ice-candidate', onIce);
    };
  }, [socket, dispatch, startRingtone, stopRingtone, handleRemoteStream]);

  return { webrtc, stopRingtone };
};
