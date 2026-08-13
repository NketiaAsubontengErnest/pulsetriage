'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Appointment } from '@/lib/types';
import { useTelehealthCall, CallStatus } from '@/lib/telehealth-call';
import { ConsultationWrapUp } from './consultation-wrapup';

interface TelehealthVideoRoomProps {
  appointment: Appointment;
  isDoctor?: boolean;
  onClose: () => void;
  onConsultationCompleted?: () => void;
}

const STATUS_LABEL: Record<CallStatus, { text: string; badge: string }> = {
  INITIALISING: { text: 'Starting camera…', badge: 'text-bg-secondary' },
  WAITING: { text: 'Waiting for the other participant', badge: 'text-bg-warning' },
  CONNECTING: { text: 'Connecting peers…', badge: 'text-bg-info' },
  CONNECTED: { text: 'LIVE — peer to peer connected', badge: 'text-bg-danger' },
  ENDED: { text: 'Call ended', badge: 'text-bg-secondary' },
  FAILED: { text: 'Connection failed — retrying', badge: 'text-bg-danger' },
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
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendChatMessage,
    endCall,
  } = useTelehealthCall({ appointmentId: appointment.id, isDoctor, displayName });

  const [activeTab, setActiveTab] = useState<'chat' | 'info'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [isWrappingUp, setIsWrappingUp] = useState(false);
  const [completedNotes, setCompletedNotes] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

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
    endCall();
    if (isDoctor) setIsWrappingUp(true);
  };

  // ─── Doctor: post-call clinical documentation ────────────────────────────────
  if (isDoctor && isWrappingUp && !completedNotes) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 bg-light" style={{ zIndex: 9999 }}>
        <ConsultationWrapUp
          appointment={appointment}
          transcript={chatTranscript}
          doctorName={appointment.doctor_name}
          onSubmitted={(notes) => setCompletedNotes(notes)}
          onExitWithoutCompleting={onClose}
        />
      </div>
    );
  }

  // ─── Both sides: consultation signed off ─────────────────────────────────────
  if (isCompleted) {
    const notes = completedNotes || appointmentNotes;
    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark text-white d-flex align-items-center justify-content-center p-3 overflow-y-auto"
        style={{ zIndex: 9999 }}
      >
        <div className="card bg-white text-dark border-0 shadow-lg rounded-4 w-100" style={{ maxWidth: '720px' }}>
          <div className="card-body p-4 text-center">
            <div
              className="rounded-circle bg-success bg-opacity-10 mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ width: '80px', height: '80px' }}
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
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark text-white d-flex align-items-center justify-content-center p-3"
        style={{ zIndex: 9999 }}
      >
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
          <button type="button" className="btn btn-outline-light" onClick={onClose}>
            Close Room
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABEL[status];
  const remoteName = remoteParticipant?.name || peerLabel;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark text-white d-flex flex-column" style={{ zIndex: 9999 }}>
      {/* Top Bar */}
      <div className="bg-black bg-opacity-75 px-3 py-2 border-bottom border-secondary d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span className={`badge ${statusInfo.badge} d-flex align-items-center gap-1`}>
            <i className="bi bi-circle-fill" style={{ fontSize: '8px' }} /> {statusInfo.text}
          </span>
          <span className="fw-semibold text-light small">
            Room #{appointment.id.slice(-6)} · {appointment.doctor_name} &amp; {appointment.patient_name}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge text-bg-secondary font-mono">{appointment.doctor_specialty}</span>
          <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose} aria-label="Leave room">
            <i className="bi bi-x-lg" />
          </button>
        </div>
      </div>

      {/* Main Call Layout */}
      <div className="flex-grow-1 d-flex flex-column flex-lg-row overflow-hidden">
        {/* Video Area */}
        <div className="flex-grow-1 bg-black p-3 d-flex flex-column position-relative justify-content-center align-items-center">
          <div className="w-100 h-100 rounded-3 overflow-hidden border border-secondary position-relative bg-dark d-flex align-items-center justify-content-center">
            {/* Remote peer video — the other participant's real camera & mic */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-100 h-100 object-fit-cover"
              style={{ display: remoteStream ? 'block' : 'none' }}
            />

            {remoteStream ? (
              <div className="position-absolute top-0 start-0 m-3 badge bg-black bg-opacity-75 text-white d-flex align-items-center gap-1 p-2">
                <i className="bi bi-camera-video-fill text-success" />
                <span>{remoteName} · live</span>
              </div>
            ) : (
              <div className="text-center p-4">
                <div
                  className="rounded-circle bg-primary bg-opacity-25 mx-auto mb-3 d-flex align-items-center justify-content-center border border-primary"
                  style={{ width: '100px', height: '100px' }}
                >
                  <i className="bi bi-person-fill text-primary display-4" />
                </div>
                <h3 className="h5 mb-1 text-light">{remoteName}</h3>
                {status === 'CONNECTING' ? (
                  <p className="small text-info mb-2">
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    Establishing encrypted peer-to-peer connection…
                  </p>
                ) : remoteParticipant ? (
                  <p className="small text-warning mb-2">
                    <i className="bi bi-hourglass-split me-1" /> {remoteName} is in the room — negotiating media…
                  </p>
                ) : (
                  <p className="small text-warning mb-2">
                    <i className="bi bi-hourglass-split me-1" /> Waiting for {peerLabel} to join this room…
                  </p>
                )}
                <div className="d-inline-flex align-items-center gap-1 bg-black bg-opacity-50 px-3 py-1 rounded-pill border border-secondary">
                  <i className="bi bi-shield-lock text-info" />
                  <span className="small text-muted">End-to-end WebRTC media</span>
                </div>
              </div>
            )}

            {/* Self PIP View */}
            <div
              className="position-absolute bottom-0 end-0 m-3 rounded-3 overflow-hidden border border-light shadow"
              style={{ width: '180px', height: '130px', backgroundColor: '#111' }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-100 h-100 object-fit-cover"
                style={{ transform: isScreenSharing ? 'none' : 'scaleX(-1)', display: isVideoOff || !localStream ? 'none' : 'block' }}
              />
              {(isVideoOff || !localStream) && (
                <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                  <i className="bi bi-camera-video-off fs-4 mb-1" />
                  <span style={{ fontSize: '10px' }}>{isVideoOff ? 'Camera Off' : 'No camera'}</span>
                </div>
              )}
              <span
                className="position-absolute bottom-0 start-0 m-1 badge bg-black bg-opacity-75 text-white"
                style={{ fontSize: '9px' }}
              >
                You ({isDoctor ? 'Doctor' : 'Patient'}){isScreenSharing ? ' · sharing screen' : ''}
              </span>
            </div>
          </div>

          {mediaError && (
            <div className="position-absolute top-0 start-0 m-4 alert alert-warning py-1 px-3 small opacity-75">
              <i className="bi bi-info-circle me-1" /> {mediaError}
            </div>
          )}

          {/* In-Call Controls Bar */}
          <div className="py-3 d-flex align-items-center justify-content-center gap-2 flex-wrap">
            <button
              type="button"
              className={`btn rounded-circle p-3 ${isAudioMuted ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleAudio}
              title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
              disabled={!localStream}
            >
              <i className={`bi fs-5 ${isAudioMuted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}`} />
            </button>

            <button
              type="button"
              className={`btn rounded-circle p-3 ${isVideoOff ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleVideo}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
              disabled={!localStream}
            >
              <i className={`bi fs-5 ${isVideoOff ? 'bi-camera-video-off-fill' : 'bi-camera-video-fill'}`} />
            </button>

            <button
              type="button"
              className={`btn rounded-circle p-3 ${isScreenSharing ? 'btn-info text-white' : 'btn-secondary'}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
            >
              <i className="bi bi-display fs-5" />
            </button>

            <button
              type="button"
              className="btn btn-danger px-4 py-2 rounded-pill d-flex align-items-center gap-2 fw-medium ms-3"
              onClick={handleEndCall}
            >
              <i className="bi bi-telephone-x-fill" />
              <span>{isDoctor ? 'End Call & Write Notes' : 'Leave Consultation'}</span>
            </button>
          </div>
        </div>

        {/* Side Panel (Chat / Info) */}
        <div className="w-100 border-start border-secondary bg-dark d-flex flex-column" style={{ maxWidth: '400px' }}>
          <div className="nav nav-tabs nav-justified border-bottom border-secondary bg-black">
            <button
              type="button"
              className={`nav-link text-white rounded-0 py-2 border-0 ${activeTab === 'chat' ? 'active bg-dark fw-bold' : 'opacity-75'}`}
              onClick={() => setActiveTab('chat')}
            >
              <i className="bi bi-chat-dots me-1" /> Live Chat
            </button>
            <button
              type="button"
              className={`nav-link text-white rounded-0 py-2 border-0 ${activeTab === 'info' ? 'active bg-dark fw-bold' : 'opacity-75'}`}
              onClick={() => setActiveTab('info')}
            >
              <i className="bi bi-info-circle me-1" /> Info
            </button>
          </div>

          <div className="flex-grow-1 p-3 overflow-y-auto d-flex flex-column">
            {activeTab === 'chat' ? (
              <div className="d-flex flex-column h-100">
                <div className="flex-grow-1 overflow-y-auto mb-3 pe-1">
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
                          <span className="fw-bold opacity-75">{msg.sender}</span>
                          <span className="opacity-50">{msg.time}</span>
                        </div>
                      )}
                      <p className="mb-0 small" style={{ wordBreak: 'break-word' }}>
                        {msg.text}
                      </p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="d-flex gap-2 border-top border-secondary pt-2">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-secondary bg-opacity-25 text-white border-secondary"
                    placeholder={`Message ${remoteName}…`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    aria-label="Chat message"
                  />
                  <button type="submit" className="btn btn-primary btn-sm px-3">
                    <i className="bi bi-send-fill" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="small text-muted d-flex flex-column gap-2">
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
                  <p className="mb-1">Status: {statusInfo.text}</p>
                  <p className="mb-0">
                    In room: You{remoteParticipant ? ` · ${remoteParticipant.name} (${remoteParticipant.role.toLowerCase()})` : ' only'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
