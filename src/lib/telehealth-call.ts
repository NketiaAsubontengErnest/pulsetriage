'use client';

// Peer-to-peer telehealth call: real WebRTC media between the doctor and the
// patient, signalled through /api/room/[appointmentId] (DB-backed polling, so
// it works on serverless hosting without a websocket server).

import { useCallback, useEffect, useRef, useState } from 'react';

export type CallStatus = 'INITIALISING' | 'WAITING' | 'CONNECTING' | 'CONNECTED' | 'ENDED' | 'FAILED';

export interface RoomChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isDoctor: boolean;
  isSystem?: boolean;
  isMine?: boolean;
}

export interface RemoteParticipant {
  peer_id: string;
  role: 'DOCTOR' | 'PATIENT';
  name: string;
}

/**
 * Everything the patient submitted before the call, delivered to the doctor's
 * side of the room so the clinical context sits next to the video instead of
 * in another tab.
 */
export interface PatientBrief {
  patient_name: string;
  patient_phone?: string | null;
  patient_email?: string | null;
  reason?: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  triage: {
    primary_symptom: string;
    symptom_duration: string;
    pain_score: number;
    red_flag_present: boolean;
    red_flags: string[];
    severity_score: number;
    urgency_level: string;
    recommended_specialty: string;
    triage_summary: string;
    action_recommendation: string;
    created_at: string;
  } | null;
  /** Signed-off notes from this patient's previous consultations, newest first. */
  history: Array<{
    id: string;
    appointment_date: string;
    doctor_name?: string | null;
    notes: string;
  }>;
}

interface RoomSignal {
  seq: number;
  sender_id: string;
  sender_role: 'DOCTOR' | 'PATIENT';
  sender_name: string;
  type: string;
  payload: any;
  created_at: string;
}

interface UseTelehealthCallOptions {
  appointmentId: string;
  isDoctor: boolean;
  displayName: string;
  /** Set false to release the camera/mic and stop signalling (e.g. after hang-up). */
  active?: boolean;
}

const POLL_INTERVAL_MS = 1500;
/** How long a dialled call may stay un-connected before the doctor re-dials. */
const NEGOTIATION_TIMEOUT_MS = 12000;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
];

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function useTelehealthCall({ appointmentId, isDoctor, displayName, active = true }: UseTelehealthCallOptions) {
  const role: 'DOCTOR' | 'PATIENT' = isDoctor ? 'DOCTOR' : 'PATIENT';

  // Stable per-session peer identity (a user may open the room twice).
  const peerIdRef = useRef<string>('');
  if (!peerIdRef.current) {
    peerIdRef.current = `${isDoctor ? 'doc' : 'pat'}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  }

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CallStatus>('INITIALISING');
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null);
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [remoteEndedCall, setRemoteEndedCall] = useState(false);
  const [appointmentStatus, setAppointmentStatus] = useState<string | null>(null);
  const [appointmentNotes, setAppointmentNotes] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  // Which of the two local devices actually opened. Reported separately so the
  // UI can say "they cannot hear you" rather than a vague media warning.
  const [hasMic, setHasMic] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  /** Set once the peer's audio track is flowing — the doctor-side sanity check. */
  const [remoteHasAudio, setRemoteHasAudio] = useState(false);
  /** Doctor-only intake brief for the patient in this room. */
  const [patientBrief, setPatientBrief] = useState<PatientBrief | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remotePeerIdRef = useRef<string | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const cursorRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);
  // Signals wait here until the serial drain gets to them.
  const inboxRef = useRef<RoomSignal[]>([]);
  const drainingRef = useRef(false);
  const dialedAtRef = useRef<number | null>(null);
  // Lets the drain call the latest handler without being re-created itself.
  const handleSignalRef = useRef<(signal: RoomSignal) => Promise<void>>(async () => {});
  // True once either side has hung up — stops presence churn from resurrecting the call UI.
  const callOverRef = useRef(false);
  // Peers that hung up on purpose — never auto-dial them again (they come back
  // with a fresh peer id if they rejoin).
  const departedPeersRef = useRef<Set<string>>(new Set());
  // React StrictMode mounts, unmounts and remounts in development. The unmount
  // cleanup must not tear the call down in that case, so it is deferred and
  // cancelled by the immediate remount.
  const mountedRef = useRef(false);

  // Media acquisition settles once, either with a stream or with an error; the
  // negotiation must wait for it, otherwise we publish a receive-only offer.
  const mediaReadyRef = useRef(false);
  const mediaWaitersRef = useRef<Array<() => void>>([]);

  const markMediaReady = useCallback(() => {
    mediaReadyRef.current = true;
    mediaWaitersRef.current.forEach((resolve) => resolve());
    mediaWaitersRef.current = [];
  }, []);

  const waitForMedia = useCallback(
    (timeoutMs = 8000) =>
      new Promise<void>((resolve) => {
        if (mediaReadyRef.current) return resolve();
        const timer = setTimeout(resolve, timeoutMs);
        mediaWaitersRef.current.push(() => {
          clearTimeout(timer);
          resolve();
        });
      }),
    []
  );

  const pushSystemMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sender: 'PulseTriage System', text, time: now(), isDoctor: false, isSystem: true },
    ]);
  }, []);

  // ─── Signalling transport ──────────────────────────────────────────────────
  const publish = useCallback(
    async (type: string, payload: unknown = {}, target_id?: string | null) => {
      try {
        await fetch(`/api/room/${appointmentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peer_id: peerIdRef.current,
            role,
            name: displayName,
            type,
            payload,
            target_id: target_id || null,
          }),
        });
      } catch (err) {
        console.warn('[telehealth] failed to publish signal', type, err);
      }
    },
    [appointmentId, role, displayName]
  );

  // ─── Peer connection ───────────────────────────────────────────────────────
  const teardownPeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    pendingIceRef.current = [];
    remotePeerIdRef.current = null;
    setRemoteStream(null);
  }, []);

  const createPeerConnection = useCallback(
    (remotePeerId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const inbound = new MediaStream();

      const stream = localStreamRef.current;
      const localKinds = new Set(stream?.getTracks().map((t) => t.kind) ?? []);
      stream?.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Both media kinds must always appear in the SDP. A peer that only got a
      // camera (mic busy, permission partially granted) would otherwise publish
      // an offer with no audio m-line at all — and because the m-lines have to
      // match on both sides, that silently kills audio in *both* directions,
      // not just the one that is missing a microphone.
      if (!localKinds.has('audio')) pc.addTransceiver('audio', { direction: 'recvonly' });
      if (!localKinds.has('video')) pc.addTransceiver('video', { direction: 'recvonly' });

      // Tracks are announced as soon as the remote description is applied —
      // that is not yet a connection, so the status stays with ICE below.
      //
      // Audio and video arrive as separate `track` events. Mutating one stream
      // object in place leaves React holding the same reference, so the video
      // element never re-attaches and the late-arriving video track renders as
      // a black rectangle. Publishing a fresh MediaStream on every track keeps
      // the identity changing and the attach effect honest.
      pc.ontrack = (event) => {
        const arriving = event.streams[0] ? event.streams[0].getTracks() : [event.track];
        const known = new Set(inbound.getTracks());
        arriving.forEach((track) => {
          if (!known.has(track)) inbound.addTrack(track);
        });
        setRemoteStream(new MediaStream(inbound.getTracks()));
        setRemoteHasAudio(inbound.getAudioTracks().some((t) => t.readyState === 'live'));

        // A track that ends (peer turned the camera off, renegotiation) should
        // drop out of the rendered stream rather than freeze on its last frame.
        event.track.onended = () => {
          try {
            inbound.removeTrack(event.track);
          } catch {}
          setRemoteStream(inbound.getTracks().length ? new MediaStream(inbound.getTracks()) : null);
          setRemoteHasAudio(inbound.getAudioTracks().some((t) => t.readyState === 'live'));
        };
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) publish('ICE', event.candidate.toJSON(), remotePeerId);
      };

      const onLinkStateChange = () => {
        if (pcRef.current !== pc) return; // a superseded connection must not drive the UI
        const state = pc.connectionState;
        if (state === 'connected') {
          setStatus('CONNECTED');
        } else if (state === 'connecting' || state === 'disconnected') {
          setStatus((prev) => (prev === 'ENDED' ? prev : 'CONNECTING'));
        } else if (state === 'failed') {
          setStatus('FAILED');
        }
      };

      pc.onconnectionstatechange = onLinkStateChange;
      pc.oniceconnectionstatechange = () => {
        // Safari/older Chromium report progress on the ICE state only.
        if (pcRef.current !== pc) return;
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setStatus('CONNECTED');
        }
      };

      pcRef.current = pc;
      remotePeerIdRef.current = remotePeerId;
      return pc;
    },
    [publish]
  );

  const flushPendingIce = useCallback(async (pc: RTCPeerConnection) => {
    const queued = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('[telehealth] failed to add queued ICE candidate', err);
      }
    }
  }, []);

  // The doctor always makes the offer; the patient always answers. That single
  // rule removes offer/answer glare without full perfect-negotiation plumbing.
  const startOffer = useCallback(
    async (remotePeerId: string) => {
      teardownPeer();
      // Claim the peer synchronously so a concurrent poll cannot dial it twice,
      // then wait for the camera before building the connection — a peer
      // created without local tracks would negotiate receive-only.
      remotePeerIdRef.current = remotePeerId;
      await waitForMedia();
      if (remotePeerIdRef.current !== remotePeerId) return; // superseded
      const pc = createPeerConnection(remotePeerId);
      setStatus('CONNECTING');
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await publish('OFFER', { sdp: pc.localDescription }, remotePeerId);
      } catch (err) {
        console.error('[telehealth] failed to create offer', err);
        setStatus('FAILED');
      }
    },
    [createPeerConnection, publish, teardownPeer, waitForMedia]
  );

  // Signals are applied one at a time, in arrival order, independently of the
  // polling effect's lifecycle.
  const drainInbox = useCallback(async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    try {
      while (inboxRef.current.length > 0) {
        const signal = inboxRef.current.shift()!;
        try {
          await handleSignalRef.current(signal);
        } catch (err) {
          console.warn('[telehealth] failed to handle signal', signal.type, err);
        }
      }
    } finally {
      drainingRef.current = false;
    }
  }, []);

  const handleSignal = useCallback(
    async (signal: RoomSignal) => {
      if (signal.type === 'CHAT') {
        setMessages((prev) => [
          ...prev,
          {
            id: `sig-${signal.seq}`,
            sender: signal.sender_name,
            text: String(signal.payload?.text ?? ''),
            time: new Date(signal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isDoctor: signal.sender_role === 'DOCTOR',
          },
        ]);
        return;
      }

      if (signal.type === 'ENDED') {
        departedPeersRef.current.add(signal.sender_id);
        teardownPeer();
        const doctorEnded = signal.sender_role === 'DOCTOR';
        if (doctorEnded) {
          callOverRef.current = true;
          setRemoteEndedCall(true);
          setStatus('ENDED');
          if (!isDoctor) {
            // The consultation is over for the patient — release the camera/mic.
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            screenStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            screenStreamRef.current = null;
            setLocalStream(null);
            setIsScreenSharing(false);
          }
        } else if (!callOverRef.current) {
          setStatus('WAITING');
        }
        pushSystemMessage(
          doctorEnded
            ? 'The doctor has ended the video consultation and is finalising the clinical notes.'
            : `${signal.sender_name} has left the consultation.`
        );
        return;
      }

      if (signal.type === 'LEAVE') {
        // Not blacklisted: presence already stops us dialling a peer that is
        // gone, and a peer that comes straight back should be dialled again.
        if (remotePeerIdRef.current === signal.sender_id) {
          teardownPeer();
          if (!callOverRef.current) setStatus('WAITING');
          pushSystemMessage(`${signal.sender_name} left the room.`);
        }
        return;
      }

      if (signal.type === 'OFFER') {
        if (isDoctor) return; // doctor never answers an offer
        if (callOverRef.current) return;
        await waitForMedia();
        // Every offer starts a fresh connection: the doctor only offers when
        // dialling or re-dialling, so answering on a half-negotiated peer
        // connection would just inherit its broken state.
        teardownPeer();
        const pc = createPeerConnection(signal.sender_id);
        setStatus('CONNECTING');
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.sdp));
          await flushPendingIce(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await publish('ANSWER', { sdp: pc.localDescription }, signal.sender_id);
        } catch (err) {
          console.error('[telehealth] failed to answer offer', err);
          setStatus('FAILED');
        }
        return;
      }

      if (signal.type === 'ANSWER') {
        const pc = pcRef.current;
        if (!pc || remotePeerIdRef.current !== signal.sender_id || pc.signalingState !== 'have-local-offer') {
          console.warn(
            `[telehealth] dropped ANSWER from ${signal.sender_id}: pc=${!!pc} negotiatingWith=${remotePeerIdRef.current} state=${pc?.signalingState}`
          );
          return;
        }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.sdp));
          await flushPendingIce(pc);
        } catch (err) {
          console.error('[telehealth] failed to apply answer', err);
        }
        return;
      }

      if (signal.type === 'ICE') {
        const pc = pcRef.current;
        const candidate = signal.payload as RTCIceCandidateInit;
        if (!candidate || !candidate.candidate) return;
        if (!pc || !pc.remoteDescription) {
          pendingIceRef.current.push(candidate);
          return;
        }
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.warn('[telehealth] failed to add ICE candidate', err);
        }
      }
    },
    [createPeerConnection, flushPendingIce, isDoctor, publish, pushSystemMessage, teardownPeer, waitForMedia]
  );

  handleSignalRef.current = handleSignal;

  // ─── Camera / microphone ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function acquireMedia() {
      // Already holding a live camera (e.g. a StrictMode remount) — keep it.
      const existing = localStreamRef.current;
      if (existing && existing.getTracks().some((t) => t.readyState === 'live')) {
        setLocalStream(existing);
        markMediaReady();
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError('This browser cannot access a camera or microphone. You can still see and hear the other participant.');
        setStatus('WAITING');
        markMediaReady();
        return;
      }

      // Clinical audio is worth more than video, so the two devices are
      // acquired independently. Asking for both in one call meant a busy camera
      // — extremely common on Windows, where another app holds it — threw and
      // left the doctor with no microphone either, which is silence on the
      // patient's end for a call that otherwise looks connected.
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      const attempts: Array<{ constraints: MediaStreamConstraints; label: string }> = [
        { constraints: { video: true, audio: audioConstraints }, label: 'camera and microphone' },
        { constraints: { audio: audioConstraints }, label: 'microphone only' },
        { constraints: { video: true }, label: 'camera only' },
      ];

      for (const attempt of attempts) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(attempt.constraints);
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          localStreamRef.current = stream;
          cameraTrackRef.current = stream.getVideoTracks()[0] || null;
          setLocalStream(stream);
          setStatus((prev) => (prev === 'INITIALISING' ? 'WAITING' : prev));

          const gotAudio = stream.getAudioTracks().length > 0;
          const gotVideo = stream.getVideoTracks().length > 0;
          setHasMic(gotAudio);
          setHasCamera(gotVideo);

          if (!gotAudio) {
            setMediaError(
              'Your microphone is unavailable, so the other participant cannot hear you. Check that no other app is using it, then reload.'
            );
          } else if (!gotVideo) {
            setMediaError('Your camera is unavailable, but your microphone is working — the consultation can continue by voice.');
          } else {
            setMediaError(null);
          }
          markMediaReady();
          return;
        } catch (err) {
          console.warn(`[telehealth] could not open ${attempt.label}`, err);
        }
      }

      if (cancelled) return;
      setHasMic(false);
      setHasCamera(false);
      setMediaError('Camera and microphone are both unavailable — permission was denied or the devices are busy. You can still see and hear the other participant.');
      setStatus((prev) => (prev === 'INITIALISING' ? 'WAITING' : prev));
      markMediaReady();
    }

    acquireMedia();
    return () => {
      cancelled = true;
    };
  }, [markMediaReady]);

  // ─── Polling loop: presence + signals + live appointment status ────────────
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const params = new URLSearchParams({
          peer_id: peerIdRef.current,
          role,
          name: displayName,
        });
        if (cursorRef.current !== null) params.set('since', String(cursorRef.current));

        const res = await fetch(`/api/room/${appointmentId}?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`sync failed (${res.status})`);
        const data = await res.json();
        if (disposed) return;

        // Queue first, advance the cursor second: signals are handled by a
        // separate serial drain, so a slow handler never stalls the heartbeat
        // and a restarted effect never loses a batch.
        if (data.signals?.length) inboxRef.current.push(...data.signals);
        cursorRef.current = data.cursor ?? cursorRef.current;
        setAppointmentStatus(data.appointment_status ?? null);
        setAppointmentNotes(data.appointment_notes ?? null);
        // Only the doctor's poll carries this; the API omits it for patients.
        if (data.patient_brief) setPatientBrief(data.patient_brief as PatientBrief);

        // Presence — who else is sitting in this room right now?
        const others: RemoteParticipant[] = (data.peers || []).filter(
          (p: RemoteParticipant) => p.peer_id !== peerIdRef.current
        );
        const other = others.find((p) => p.role !== role) || others[0] || null;

        if (other) {
          setRemoteParticipant((prev) => (prev?.peer_id === other.peer_id ? prev : other));
          const hasDeparted = departedPeersRef.current.has(other.peer_id);
          // Re-dial if we have never called this peer, or if a call we started
          // has not come up within the negotiation timeout (lost signal, ICE
          // failure, peer reloaded).
          const stalled =
            remotePeerIdRef.current === other.peer_id &&
            dialedAtRef.current !== null &&
            Date.now() - dialedAtRef.current > NEGOTIATION_TIMEOUT_MS &&
            pcRef.current?.connectionState !== 'connected' &&
            pcRef.current?.iceConnectionState !== 'connected' &&
            pcRef.current?.iceConnectionState !== 'completed';

          if (isDoctor && !hasDeparted && !callOverRef.current && (remotePeerIdRef.current !== other.peer_id || stalled)) {
            dialedAtRef.current = Date.now();
            void startOffer(other.peer_id);
          }
        } else {
          setRemoteParticipant(null);
          if (remotePeerIdRef.current) {
            teardownPeer();
            if (!callOverRef.current) setStatus('WAITING');
          } else if (!callOverRef.current) {
            setStatus((prev) => (prev === 'CONNECTED' ? 'WAITING' : prev));
          }
        }

        void drainInbox();
      } catch (err) {
        console.warn('[telehealth] room sync failed', err);
      } finally {
        if (!disposed) timer = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    tick();

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
    };
  }, [active, appointmentId, displayName, drainInbox, isDoctor, role, startOffer, teardownPeer]);

  // ─── Teardown on unmount ───────────────────────────────────────────────────
  const stopEverything = useCallback(
    (broadcast: 'ENDED' | 'LEAVE' | null = 'LEAVE') => {
      if (stoppedRef.current) return;
      stoppedRef.current = true;

      if (broadcast) publish(broadcast, {});
      try {
        fetch(`/api/room/${appointmentId}?peer_id=${encodeURIComponent(peerIdRef.current)}`, {
          method: 'DELETE',
          keepalive: true,
        }).catch(() => undefined);
      } catch {}

      teardownPeer();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      screenStreamRef.current = null;
      setLocalStream(null);
    },
    [appointmentId, publish, teardownPeer]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current) stopEverything('LEAVE');
      }, 300);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Controls ──────────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    setIsAudioMuted((muted) => {
      const next = !muted;
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOff((off) => {
      const next = !off;
      localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, []);

  const stopScreenShare = useCallback(async () => {
    const camera = cameraTrackRef.current;
    const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
    if (sender && camera) await sender.replaceTrack(camera).catch(() => undefined);
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMediaError('Screen sharing is not supported by this browser.');
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      screenStreamRef.current = display;
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);
      screenTrack.onended = () => {
        stopScreenShare();
      };
      setIsScreenSharing(true);
    } catch (err) {
      console.warn('[telehealth] screen share cancelled', err);
    }
  }, [isScreenSharing, stopScreenShare]);

  const sendChatMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setMessages((prev) => [
        ...prev,
        {
          id: `me-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender: displayName,
          text: trimmed,
          time: now(),
          isDoctor,
          isMine: true,
        },
      ]);
      publish('CHAT', { text: trimmed });
    },
    [displayName, isDoctor, publish]
  );

  /** Hang up locally and tell the other side the call is over. */
  const endCall = useCallback(() => {
    callOverRef.current = true;
    setStatus('ENDED');
    publish('ENDED', {});
    teardownPeer();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setIsScreenSharing(false);
  }, [publish, teardownPeer]);

  return {
    peerId: peerIdRef.current,
    localStream,
    remoteStream,
    status,
    remoteParticipant,
    messages,
    mediaError,
    remoteEndedCall,
    appointmentStatus,
    appointmentNotes,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    hasMic,
    hasCamera,
    remoteHasAudio,
    patientBrief,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendChatMessage,
    pushSystemMessage,
    endCall,
    leaveRoom: () => stopEverything('LEAVE'),
  };
}
