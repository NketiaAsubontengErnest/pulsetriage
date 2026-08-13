'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Appointment } from '@/lib/types';
import { useTelehealthCall, CallStatus, RoomChatMessage, PatientBrief } from '@/lib/telehealth-call';
import { ConsultationWrapUp } from './consultation-wrapup';
import {
  PatientBriefTab,
  ClinicalNotesTab,
  InCallAiTab,
  readDraftNotes,
  draftNotesKey,
} from './in-call-clinical-panel';

interface TelehealthVideoRoomProps {
  appointment: Appointment;
  isDoctor?: boolean;
  onClose: () => void;
  onConsultationCompleted?: () => void;
}

const STATUS_LABEL: Record<CallStatus, { text: string; short: string; badge: string }> = {
  INITIALISING: { text: 'Starting camera…', short: 'Starting', badge: 'text-bg-secondary' },
  WAITING: { text: 'Waiting for the other participant', short: 'Waiting', badge: 'text-bg-warning' },
  CONNECTING: { text: 'Connecting peers…', short: 'Connecting', badge: 'text-bg-info' },
  CONNECTED: { text: 'LIVE — peer to peer connected', short: 'LIVE', badge: 'text-bg-danger' },
  ENDED: { text: 'Call ended', short: 'Ended', badge: 'text-bg-secondary' },
  FAILED: { text: 'Connection failed — retrying', short: 'Reconnecting', badge: 'text-bg-danger' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Chat + info panel, shared by the desktop sidebar and the mobile bottom sheet.
// Declared at module scope so switching between the two never remounts it and
// loses the scroll position or the half-typed message.
// ─────────────────────────────────────────────────────────────────────────────
type PanelTab = 'chat' | 'patient' | 'notes' | 'ai' | 'info';

interface TabSpec {
  id: PanelTab;
  label: string;
  icon: string;
}

/** The patient keeps the original two tabs; the doctor gets the clinical set. */
const PATIENT_TABS: TabSpec[] = [
  { id: 'chat', label: 'Chat', icon: 'bi-chat-dots' },
  { id: 'info', label: 'Info', icon: 'bi-info-circle' },
];

const DOCTOR_TABS: TabSpec[] = [
  { id: 'chat', label: 'Chat', icon: 'bi-chat-dots' },
  { id: 'patient', label: 'Patient', icon: 'bi-person-vcard' },
  { id: 'notes', label: 'Notes', icon: 'bi-pencil-square' },
  { id: 'ai', label: 'AI', icon: 'bi-stars' },
  { id: 'info', label: 'Info', icon: 'bi-info-circle' },
];

interface ConsultationPanelProps {
  appointment: Appointment;
  isDoctor: boolean;
  messages: RoomChatMessage[];
  remoteName: string;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  statusText: string;
  remoteParticipantLabel: string;
  patientBrief: PatientBrief | null;
  clinicalNotes: string;
  onClinicalNotesChange: (value: string) => void;
  chatTranscript: string;
  unreadCount: number;
  /** Connection diagnostics shown on the Info tab. */
  hasMic: boolean;
  hasCamera: boolean;
  remoteHasAudio: boolean;
  isRemoteAudioOn: boolean;
}

const ConsultationPanel: React.FC<ConsultationPanelProps> = ({
  appointment,
  isDoctor,
  messages,
  remoteName,
  activeTab,
  onTabChange,
  chatInput,
  onChatInputChange,
  onSendMessage,
  statusText,
  remoteParticipantLabel,
  patientBrief,
  clinicalNotes,
  onClinicalNotesChange,
  chatTranscript,
  unreadCount,
  hasMic,
  hasCamera,
  remoteHasAudio,
  isRemoteAudioOn,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const tabs = isDoctor ? DOCTOR_TABS : PATIENT_TABS;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, activeTab]);

  return (
    <>
      <div className="nav nav-tabs nav-justified border-bottom border-secondary bg-black flex-shrink-0 thr-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`nav-link text-white rounded-0 py-2 border-0 position-relative ${
              activeTab === tab.id ? 'active bg-dark fw-bold' : 'opacity-75'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <i className={`bi ${tab.icon} me-1`} />
            {tab.label}
            {tab.id === 'chat' && unreadCount > 0 && activeTab !== 'chat' && (
              <span className="badge rounded-pill bg-danger thr-tab-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'patient' ? (
        <PatientBriefTab appointment={appointment} brief={patientBrief} />
      ) : activeTab === 'notes' ? (
        <ClinicalNotesTab appointmentId={appointment.id} value={clinicalNotes} onChange={onClinicalNotesChange} />
      ) : activeTab === 'ai' ? (
        <InCallAiTab
          appointment={appointment}
          brief={patientBrief}
          notes={clinicalNotes}
          chatTranscript={chatTranscript}
          onInsertIntoNotes={(text) =>
            onClinicalNotesChange(clinicalNotes ? `${clinicalNotes.replace(/\s*$/, '')}\n\n${text}` : text)
          }
        />
      ) : activeTab === 'chat' ? (
        <div className="d-flex flex-column flex-grow-1 min-h-0">
          <div className="flex-grow-1 overflow-y-auto p-3">
            <div className="mb-2 p-2 rounded-3 bg-secondary bg-opacity-25 text-center small text-muted">
              Encrypted telehealth consultation room · #{appointment.id.slice(-6)}
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-2 p-2 rounded-3 ${
                  msg.isSystem
                    ? 'bg-secondary bg-opacity-25 text-center small text-muted'
                    : msg.isMine
                      ? 'bg-primary text-white ms-4'
                      : 'bg-secondary bg-opacity-50 text-light me-4'
                }`}
              >
                {!msg.isSystem && (
                  <div className="d-flex align-items-center justify-content-between mb-1" style={{ fontSize: '11px' }}>
                    <span className="fw-bold opacity-75 text-truncate">{msg.sender}</span>
                    <span className="opacity-50 flex-shrink-0 ps-2">{msg.time}</span>
                  </div>
                )}
                <p className="mb-0 small" style={{ wordBreak: 'break-word' }}>
                  {msg.text}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={onSendMessage} className="d-flex gap-2 border-top border-secondary p-2 flex-shrink-0">
            <input
              type="text"
              className="form-control form-control-sm bg-secondary bg-opacity-25 text-white border-secondary"
              placeholder={`Message ${remoteName}…`}
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              aria-label="Chat message"
            />
            <button type="submit" className="btn btn-primary btn-sm px-3" aria-label="Send message">
              <i className="bi bi-send-fill" />
            </button>
          </form>
        </div>
      ) : (
        <div className="small text-muted d-flex flex-column gap-2 p-3 overflow-y-auto flex-grow-1">
          <div className="p-2 bg-secondary bg-opacity-25 rounded-3">
            <strong className="text-light d-block mb-1">Consultation Details</strong>
            <p className="mb-1">Doctor: {appointment.doctor_name}</p>
            <p className="mb-1">Patient: {appointment.patient_name}</p>
            <p className="mb-1">Specialty: {appointment.doctor_specialty}</p>
            <p className="mb-0">
              Time slot: {appointment.start_time} – {appointment.end_time}
            </p>
          </div>

          <div className="p-2 bg-secondary bg-opacity-25 rounded-3">
            <strong className="text-light d-block mb-1">Intake Reason</strong>
            <p className="mb-0">{appointment.reason || 'General Telehealth Consultation'}</p>
          </div>

          <div className="p-2 bg-secondary bg-opacity-25 rounded-3">
            <strong className="text-light d-block mb-1">Connection</strong>
            <p className="mb-1">Status: {statusText}</p>
            <p className="mb-0">In room: {remoteParticipantLabel}</p>
          </div>

          {/* Audio path diagnostics — the fastest way to tell "they can't hear
              me" apart from "I can't hear them". */}
          <div className="p-2 bg-secondary bg-opacity-25 rounded-3">
            <strong className="text-light d-block mb-1">Audio &amp; video check</strong>
            <p className="mb-1">
              <i className={`bi me-1 ${hasMic ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`} />
              Your microphone: {hasMic ? 'sending' : 'not available — they cannot hear you'}
            </p>
            <p className="mb-1">
              <i className={`bi me-1 ${hasCamera ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-warning'}`} />
              Your camera: {hasCamera ? 'sending' : 'not available'}
            </p>
            <p className="mb-1">
              <i
                className={`bi me-1 ${remoteHasAudio ? 'bi-check-circle-fill text-success' : 'bi-dash-circle-fill text-warning'}`}
              />
              {remoteName}&apos;s microphone: {remoteHasAudio ? 'receiving' : 'no audio track yet'}
            </p>
            <p className="mb-0">
              <i className={`bi me-1 ${isRemoteAudioOn ? 'bi-volume-up-fill text-success' : 'bi-volume-mute-fill text-warning'}`} />
              Your speaker: {isRemoteAudioOn ? 'on' : 'muted — tap the speaker button to hear them'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export const TelehealthVideoRoom: React.FC<TelehealthVideoRoomProps> = ({
  appointment,
  isDoctor = false,
  onClose,
  onConsultationCompleted,
}) => {
  const displayName = (isDoctor ? appointment.doctor_name : appointment.patient_name) || (isDoctor ? 'Attending Doctor' : 'Patient');
  const peerLabel = (isDoctor ? appointment.patient_name : appointment.doctor_name) || (isDoctor ? 'Patient' : 'Doctor');

  const {
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
    endCall,
  } = useTelehealthCall({ appointmentId: appointment.id, isDoctor, displayName });

  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [chatInput, setChatInput] = useState('');
  const [isWrappingUp, setIsWrappingUp] = useState(false);
  const [completedNotes, setCompletedNotes] = useState<string | null>(null);
  // In-call scratchpad, restored if the doctor reloaded mid-consultation.
  const [clinicalNotes, setClinicalNotes] = useState(() => (isDoctor ? readDraftNotes(appointment.id) : ''));

  // Mobile chat: a floating button with an unread badge that opens a sheet.
  const [isChatSheetOpen, setIsChatSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenMessageCountRef = useRef(0);

  // The peer's sound is played by a dedicated <audio> element rather than by
  // the <video> tag. A video element that carries audio is refused autoplay,
  // and the old code coped by muting it — which silenced the consultation. Now
  // the picture always plays (muted video autoplay is unconditionally allowed)
  // and only the audio element has to negotiate the autoplay policy.
  const [isRemoteAudioOn, setIsRemoteAudioOn] = useState(true);
  const [audioNeedsGesture, setAudioNeedsGesture] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // ─── Picture: always muted, so it can never be blocked ─────────────────────
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;
    if (el.srcObject !== remoteStream) el.srcObject = remoteStream;
    el.muted = true;
    if (remoteStream) el.play().catch(() => undefined);
  }, [remoteStream]);

  // ─── Sound: separate element, unmuted, with a gesture fallback ─────────────
  useEffect(() => {
    const el = remoteAudioRef.current;
    if (!el) return;

    if (el.srcObject !== remoteStream) el.srcObject = remoteStream;
    if (!remoteStream) {
      setAudioNeedsGesture(false);
      return;
    }

    let cancelled = false;

    const attemptPlay = async () => {
      el.muted = !isRemoteAudioOn;
      el.volume = 1;
      try {
        await el.play();
        if (!cancelled) setAudioNeedsGesture(false);
      } catch {
        // Autoplay policy — the picture is already running, so all that is
        // missing is one tap to release the sound.
        if (!cancelled) setAudioNeedsGesture(isRemoteAudioOn);
      }
    };

    void attemptPlay();
    el.addEventListener('loadedmetadata', attemptPlay);
    el.addEventListener('canplay', attemptPlay);

    return () => {
      cancelled = true;
      el.removeEventListener('loadedmetadata', attemptPlay);
      el.removeEventListener('canplay', attemptPlay);
    };
  }, [remoteStream, isRemoteAudioOn]);

  // Own preview: always muted (no echo), but iOS still needs an explicit play().
  useEffect(() => {
    const el = localVideoRef.current;
    if (!el) return;
    if (el.srcObject !== localStream) el.srcObject = localStream;
    if (localStream) el.play().catch(() => undefined);
  }, [localStream]);

  /** Speaker control. One tap also satisfies the autoplay policy for the session. */
  const toggleRemoteAudio = useCallback(() => {
    const el = remoteAudioRef.current;
    const next = !isRemoteAudioOn;
    setIsRemoteAudioOn(next);
    if (!el) return;
    el.muted = !next;
    if (next) {
      el.play()
        .then(() => setAudioNeedsGesture(false))
        .catch(() => setAudioNeedsGesture(true));
    }
  }, [isRemoteAudioOn]);

  const handleEnableRemoteAudio = useCallback(() => {
    const el = remoteAudioRef.current;
    if (!el) return;
    setIsRemoteAudioOn(true);
    el.muted = false;
    el.play()
      .then(() => setAudioNeedsGesture(false))
      .catch(() => setAudioNeedsGesture(true));
  }, []);

  // The desktop sidebar is always on screen; the mobile sheet is not. Unread
  // counting has to know which layout is actually rendered.
  const [isWideLayout, setIsWideLayout] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 992px)');
    const update = () => setIsWideLayout(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // ─── Unread chat tracking ──────────────────────────────────────────────────
  const chatIsVisible = (isWideLayout || isChatSheetOpen) && activeTab === 'chat';

  useEffect(() => {
    if (chatIsVisible) {
      seenMessageCountRef.current = messages.length;
      setUnreadCount(0);
      return;
    }
    const fresh = messages.slice(seenMessageCountRef.current).filter((m) => !m.isSystem && !m.isMine).length;
    seenMessageCountRef.current = messages.length;
    if (fresh > 0) setUnreadCount((count) => count + fresh);
  }, [messages, chatIsVisible]);

  // Escape closes the sheet, and a sheet left open must not survive a hang-up.
  useEffect(() => {
    if (!isChatSheetOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsChatSheetOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isChatSheetOpen]);

  // The patient's view flips to "completed" the moment the doctor submits notes.
  const isCompleted = appointmentStatus === 'COMPLETED' || completedNotes !== null;

  const handleLeaveCompletedRoom = () => (onConsultationCompleted ? onConsultationCompleted() : onClose());

  const chatTranscript = useMemo(
    () =>
      messages
        .filter((m) => !m.isSystem)
        .map((m) => `${m.sender}: ${m.text}`)
        .join('\n'),
    [messages]
  );

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const handleEndCall = () => {
    setIsChatSheetOpen(false);
    endCall();
    if (isDoctor) setIsWrappingUp(true);
  };

  // ─── Doctor: post-call clinical documentation ────────────────────────────────
  if (isDoctor && isWrappingUp && !completedNotes) {
    return (
      <div className="thr-root bg-light overflow-auto">
        <ConsultationWrapUp
          appointment={appointment}
          transcript={chatTranscript}
          // Whatever the doctor typed while the call was running becomes the
          // starting draft instead of being thrown away at hang-up.
          liveNotes={clinicalNotes}
          patientBrief={patientBrief}
          doctorName={appointment.doctor_name}
          onSubmitted={(notes) => {
            try {
              window.localStorage.removeItem(draftNotesKey(appointment.id));
            } catch {}
            setCompletedNotes(notes);
          }}
          onExitWithoutCompleting={onClose}
        />
      </div>
    );
  }

  // ─── Both sides: consultation signed off ─────────────────────────────────────
  if (isCompleted) {
    const notes = completedNotes || appointmentNotes;
    return (
      <div className="thr-root bg-dark text-white d-flex align-items-start align-items-sm-center justify-content-center p-3 overflow-auto">
        <div className="card bg-white text-dark border-0 shadow-lg rounded-4 w-100 my-auto" style={{ maxWidth: '720px' }}>
          <div className="card-body p-3 p-sm-4 text-center">
            <div
              className="rounded-circle bg-success bg-opacity-10 mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ width: '72px', height: '72px' }}
            >
              <i className="bi bi-check2-circle text-success display-5" />
            </div>
            <h2 className="h5 fw-bold mb-1">Consultation Completed</h2>
            <p className="text-muted small mb-3">
              {isDoctor
                ? `Your clinical notes were submitted and ${appointment.patient_name}'s appointment is now marked COMPLETED.`
                : `Dr. ${appointment.doctor_name} has completed this consultation and signed off the clinical notes.`}
            </p>

            <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
              <span className="badge text-bg-info">{appointment.doctor_specialty}</span>
              <span className="badge text-bg-secondary">
                {appointment.appointment_date} · {appointment.start_time}
              </span>
              <span className="badge text-bg-success">COMPLETED</span>
            </div>

            {notes && (
              <div className="text-start bg-light border rounded-3 p-3 mb-3" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <h3 className="h6 fw-bold mb-2">
                  <i className="bi bi-journal-text me-1" /> Consultation notes
                </h3>
                <pre className="small mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {notes}
                </pre>
              </div>
            )}

            <button type="button" className="btn btn-primary px-4" onClick={handleLeaveCompletedRoom}>
              {isDoctor ? 'Back to Consultations' : 'Back to My Appointments'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Patient: doctor hung up, notes still being written ──────────────────────
  if (!isDoctor && (remoteEndedCall || status === 'ENDED')) {
    return (
      <div className="thr-root bg-dark text-white d-flex align-items-center justify-content-center p-3">
        <div className="text-center" style={{ maxWidth: '520px' }}>
          <i className="bi bi-clipboard2-pulse display-4 text-info mb-3 d-block" />
          <h2 className="h5 mb-2">The video consultation has ended</h2>
          <p className="text-white-50 small mb-3">
            Dr. {appointment.doctor_name} is writing up your clinical notes. This appointment will show as{' '}
            <strong className="text-white">COMPLETED</strong> in your portal as soon as the notes are submitted — you can
            wait here or close this room.
          </p>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3 small text-white-50">
            <span className="spinner-border spinner-border-sm text-info" role="status" aria-hidden="true" />
            <span>Waiting for the doctor to sign off…</span>
          </div>
          <button type="button" className="btn btn-outline-light px-4" onClick={onClose}>
            Close Room
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABEL[status];
  const remoteName = remoteParticipant?.name || peerLabel;
  const remoteParticipantLabel = `You${remoteParticipant ? ` · ${remoteParticipant.name} (${remoteParticipant.role.toLowerCase()})` : ' only'}`;

  const panelProps: ConsultationPanelProps = {
    appointment,
    isDoctor,
    messages,
    remoteName,
    activeTab,
    onTabChange: setActiveTab,
    chatInput,
    onChatInputChange: setChatInput,
    onSendMessage: handleSendMessage,
    statusText: statusInfo.text,
    remoteParticipantLabel,
    patientBrief,
    clinicalNotes,
    onClinicalNotesChange: setClinicalNotes,
    chatTranscript,
    unreadCount,
    hasMic,
    hasCamera,
    remoteHasAudio,
    isRemoteAudioOn,
  };

  return (
    <div className="thr-root bg-dark text-white d-flex flex-column">
      {/* ── Top bar: one compact row that never wraps on a phone ────────────── */}
      <header className="thr-topbar bg-black bg-opacity-75 border-bottom border-secondary d-flex align-items-center gap-2">
        <span className={`badge ${statusInfo.badge} d-flex align-items-center gap-1 flex-shrink-0`}>
          <i className="bi bi-circle-fill" style={{ fontSize: '7px' }} />
          <span className="d-lg-none">{statusInfo.short}</span>
          <span className="d-none d-lg-inline">{statusInfo.text}</span>
        </span>

        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-light text-truncate thr-room-title">
            Room #{appointment.id.slice(-6)} · {appointment.doctor_name} &amp; {appointment.patient_name}
          </div>
        </div>

        <span className="badge text-bg-secondary d-none d-md-inline flex-shrink-0">{appointment.doctor_specialty}</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-light flex-shrink-0 thr-close-btn"
          onClick={onClose}
          aria-label="Leave room"
        >
          <i className="bi bi-x-lg" />
        </button>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-grow-1 d-flex flex-column flex-lg-row min-h-0">
        {/* Stage: the peer's video fills every pixel that is left over */}
        <main className="thr-stage flex-grow-1 position-relative bg-black d-flex flex-column min-h-0">
          <div className="thr-video-wrap position-relative flex-grow-1 min-h-0">
            {/* Remote peer video — kept mounted at all times. A `display:none`
                video cannot start playing on iOS, so the waiting state is an
                overlay rather than a swap. */}
            <video ref={remoteVideoRef} autoPlay playsInline muted className="thr-remote-video" />

            {/* Carries the peer's voice. Separate from the video so the picture
                is never held hostage by the autoplay policy. */}
            <audio ref={remoteAudioRef} autoPlay playsInline />

            {remoteStream ? (
              <span className="thr-name-tag badge bg-black bg-opacity-75 text-white d-inline-flex align-items-center gap-1">
                <i className="bi bi-camera-video-fill text-success" />
                <span className="text-truncate">{remoteName} · live</span>
              </span>
            ) : (
              <div className="thr-waiting position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-3">
                <div className="thr-avatar rounded-circle bg-primary bg-opacity-25 mb-3 d-flex align-items-center justify-content-center border border-primary">
                  <i className="bi bi-person-fill text-primary display-5" />
                </div>
                <h3 className="h6 mb-1 text-light">{remoteName}</h3>
                {status === 'CONNECTING' ? (
                  <p className="small text-info mb-2">
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    Establishing encrypted connection…
                  </p>
                ) : remoteParticipant ? (
                  <p className="small text-warning mb-2">
                    <i className="bi bi-hourglass-split me-1" /> {remoteName} is in the room — negotiating media…
                  </p>
                ) : (
                  <p className="small text-warning mb-2">
                    <i className="bi bi-hourglass-split me-1" /> Waiting for {peerLabel} to join…
                  </p>
                )}
                <div className="d-inline-flex align-items-center gap-1 bg-black bg-opacity-50 px-3 py-1 rounded-pill border border-secondary">
                  <i className="bi bi-shield-lock text-info" />
                  <span className="small text-muted">End-to-end WebRTC media</span>
                </div>
              </div>
            )}

            {/* Sound is the only thing a phone's autoplay policy can hold back —
                offer the one tap that releases it. */}
            {remoteStream && audioNeedsGesture && (
              <button type="button" className="thr-unmute btn btn-warning btn-sm rounded-pill shadow" onClick={handleEnableRemoteAudio}>
                <i className="bi bi-volume-up-fill me-1" />
                Tap to hear {remoteName}
              </button>
            )}

            {/* The peer is connected but sending no audio at all — that is a
                device problem on their end, not a speaker problem here. */}
            {remoteStream && !remoteHasAudio && status === 'CONNECTED' && (
              <div className="thr-audio-warning badge text-bg-warning text-dark shadow">
                <i className="bi bi-mic-mute-fill me-1" />
                {remoteName} is not sending any audio
              </div>
            )}

            {/* Self view */}
            <div className="thr-pip rounded-3 overflow-hidden border border-light shadow position-absolute">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-100 h-100 object-fit-cover"
                style={{
                  transform: isScreenSharing ? 'none' : 'scaleX(-1)',
                  display: isVideoOff || !localStream ? 'none' : 'block',
                }}
              />
              {(isVideoOff || !localStream) && (
                <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                  <i className="bi bi-camera-video-off fs-5 mb-1" />
                  <span style={{ fontSize: '9px' }}>{isVideoOff ? 'Camera Off' : 'No camera'}</span>
                </div>
              )}
              <span className="thr-pip-tag badge bg-black bg-opacity-75 text-white">
                You{isScreenSharing ? ' · sharing' : ''}
              </span>
            </div>

            {mediaError && (
              <div className="thr-media-error alert alert-warning py-1 px-2 small mb-0 shadow-sm">
                <i className="bi bi-info-circle me-1" />
                {mediaError}
              </div>
            )}

            {/* Floating chat launcher — phones and tablets only */}
            <button
              type="button"
              className="thr-chat-fab btn btn-primary rounded-circle shadow-lg d-lg-none position-absolute"
              onClick={() => {
                setActiveTab('chat');
                setIsChatSheetOpen(true);
              }}
              aria-label={unreadCount > 0 ? `Open live chat, ${unreadCount} unread messages` : 'Open live chat'}
            >
              <i className="bi bi-chat-dots-fill fs-5" />
              {unreadCount > 0 && (
                <span className="thr-chat-badge badge rounded-pill bg-danger border border-2 border-dark">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* The doctor's clinical panel needs its own way in on a phone —
                the chat button alone would bury the intake record. */}
            {isDoctor && (
              <button
                type="button"
                className="thr-clinical-fab btn btn-warning rounded-circle shadow-lg d-lg-none position-absolute"
                onClick={() => {
                  setActiveTab('patient');
                  setIsChatSheetOpen(true);
                }}
                aria-label="Open patient record, notes and AI assistant"
              >
                <i className="bi bi-clipboard2-pulse fs-5" />
              </button>
            )}
          </div>

          {/* ── Call controls ───────────────────────────────────────────────── */}
          <div className="thr-controls d-flex align-items-center justify-content-center gap-2 flex-shrink-0">
            <button
              type="button"
              className={`btn rounded-circle thr-ctl ${isAudioMuted ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleAudio}
              title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
              aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
              disabled={!localStream}
            >
              <i className={`bi ${isAudioMuted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}`} />
            </button>

            {/* Speaker. Always present, so "I cannot hear them" is one tap away
                rather than depending on a transient prompt. */}
            <button
              type="button"
              className={`btn rounded-circle thr-ctl ${isRemoteAudioOn ? 'btn-secondary' : 'btn-danger'}`}
              onClick={toggleRemoteAudio}
              title={isRemoteAudioOn ? `Mute ${remoteName}` : `Unmute ${remoteName}`}
              aria-label={isRemoteAudioOn ? `Mute ${remoteName}` : `Unmute ${remoteName}`}
            >
              <i className={`bi ${isRemoteAudioOn ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'}`} />
            </button>

            <button
              type="button"
              className={`btn rounded-circle thr-ctl ${isVideoOff ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleVideo}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
              aria-label={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
              disabled={!localStream}
            >
              <i className={`bi ${isVideoOff ? 'bi-camera-video-off-fill' : 'bi-camera-video-fill'}`} />
            </button>

            {/* Screen sharing is a desktop affordance — getDisplayMedia is not
                available on mobile browsers, so the button is hidden there
                instead of failing on tap. */}
            <button
              type="button"
              className={`btn rounded-circle thr-ctl d-none d-md-inline-flex ${isScreenSharing ? 'btn-info text-white' : 'btn-secondary'}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
              aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
            >
              <i className="bi bi-display" />
            </button>

            <button
              type="button"
              className="btn btn-danger rounded-pill d-flex align-items-center gap-2 fw-medium thr-hangup"
              onClick={handleEndCall}
            >
              <i className="bi bi-telephone-x-fill" />
              <span className="d-none d-sm-inline">{isDoctor ? 'End Call & Write Notes' : 'Leave Consultation'}</span>
              <span className="d-sm-none">{isDoctor ? 'End & Note' : 'Leave'}</span>
            </button>
          </div>
        </main>

        {/* ── Desktop side panel ──────────────────────────────────────────────── */}
        <aside className="thr-panel border-start border-secondary bg-dark d-none d-lg-flex flex-column">
          <ConsultationPanel {...panelProps} />
        </aside>
      </div>

      {/* ── Mobile chat sheet ─────────────────────────────────────────────────── */}
      {isChatSheetOpen && (
        <div className="thr-sheet-backdrop d-lg-none" onClick={() => setIsChatSheetOpen(false)} role="presentation">
          <section
            className="thr-sheet bg-dark text-white d-flex flex-column"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Live consultation chat"
          >
            <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom border-secondary flex-shrink-0">
              <span className="thr-sheet-grip" aria-hidden="true" />
              <strong className="small text-truncate">{remoteName}</strong>
              <button
                type="button"
                className="btn btn-sm btn-outline-light border-0"
                onClick={() => setIsChatSheetOpen(false)}
                aria-label="Close chat"
              >
                <i className="bi bi-chevron-down" />
              </button>
            </div>
            <ConsultationPanel {...panelProps} />
          </section>
        </div>
      )}
    </div>
  );
};
