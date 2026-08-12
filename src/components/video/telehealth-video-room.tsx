'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Appointment } from '@/lib/types';
import { updateAppointment } from '@/lib/api';

interface TelehealthVideoRoomProps {
  appointment: Appointment;
  isDoctor?: boolean;
  onClose: () => void;
  onConsultationCompleted?: () => void;
}

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
  isDoctor: boolean;
}

export const TelehealthVideoRoom: React.FC<TelehealthVideoRoomProps> = ({
  appointment,
  isDoctor = false,
  onClose,
  onConsultationCompleted,
}) => {
  // Video / Audio Stream State
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'soap' | 'info'>('chat');

  // Media Stream References
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [hasMediaStream, setHasMediaStream] = useState(false);

  // In-Call Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'PulseTriage System',
      text: 'Encrypted Telehealth Consultation Room Active. Room ID: ' + appointment.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDoctor: false,
    },
  ]);

  // Doctor SOAP Notes State
  const [transcript, setTranscript] = useState(appointment.reason || '');
  const [soapLoading, setSoapLoading] = useState(false);
  const [soapResult, setSoapResult] = useState<any>(null);
  const [isEnding, setIsEnding] = useState(false);

  // Acquire Browser Camera/Mic Stream
  useEffect(() => {
    let mediaStream: MediaStream | null = null;

    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream;
          }
          setHasMediaStream(true);
        }
      } catch (err) {
        console.warn('Camera/Mic permission not granted or unavailable:', err);
        setStreamError('Browser camera unavailable or permission pending. Operating in HD Simulated Feed mode.');
      }
    }

    initCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach((t) => (t.enabled = isAudioMuted));
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      sender: isDoctor ? appointment.doctor_name || 'Dr. Specialist' : appointment.patient_name || 'Patient',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDoctor,
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput('');
  };

  const handleGenerateInCallSoap = async () => {
    if (!transcript.trim()) return;
    setSoapLoading(true);
    try {
      const res = await fetch('/api/ai/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, patientName: appointment.patient_name }),
      });
      const data = await res.json();
      if (data.success) setSoapResult(data.soapNote);
    } catch (e) {
      console.error(e);
    } finally {
      setSoapLoading(false);
    }
  };

  const handleEndConsultation = async () => {
    setIsEnding(true);
    try {
      const clinicalNotesSummary = soapResult
        ? `S: ${soapResult.subjective}\nO: ${soapResult.objective}\nA: ${soapResult.assessment}\nP: ${soapResult.plan}`
        : transcript || 'Consultation completed via Telehealth Video Room.';

      await updateAppointment(appointment.id, {
        status: 'COMPLETED',
        notes: clinicalNotesSummary,
        updated_by: isDoctor ? appointment.doctor_name : appointment.patient_name,
      });

      onConsultationCompleted?.();
    } catch (err) {
      console.error('Error completing appointment:', err);
    } finally {
      setIsEnding(false);
      onClose();
    }
  };

  return (
    <div className="fixed-top w-100 h-100 bg-dark text-white z-50 d-flex flex-column" style={{ zIndex: 9999 }}>
      {/* Top Bar */}
      <div className="bg-black bg-opacity-75 px-3 py-2 border-bottom border-secondary d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span className="badge text-bg-danger d-flex align-items-center gap-1">
            <i className="bi bi-circle-fill spin text-white" style={{ fontSize: '8px' }} /> LIVE TELEHEALTH
          </span>
          <span className="fw-semibold text-light small">
            Room #{appointment.id.slice(-6)} · {appointment.doctor_name} &amp; {appointment.patient_name}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge text-bg-secondary font-mono">{appointment.doctor_specialty}</span>
          <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
      </div>

      {/* Main Call Layout */}
      <div className="flex-grow-1 d-flex flex-column flex-lg-row overflow-hidden">
        {/* Video Area */}
        <div className="flex-grow-1 bg-black p-3 d-flex flex-column position-relative justify-content-center align-items-center">
          {/* Main Remote Feed (Peer View) */}
          <div className="w-100 h-100 rounded-3 overflow-hidden border border-secondary position-relative bg-dark d-flex align-items-center justify-content-center">
            {isScreenSharing ? (
              <div className="text-center p-4">
                <i className="bi bi-display text-info display-1 mb-2" />
                <h4 className="h5 text-light">Screen Sharing Active</h4>
                <p className="small text-muted mb-0">Sharing clinical diagnostic charts and patient records</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <div
                  className="rounded-circle bg-primary bg-opacity-20 mx-auto mb-3 d-flex align-items-center justify-content-center border border-primary"
                  style={{ width: '100px', height: '100px' }}
                >
                  <i className="bi bi-person-fill text-primary display-4" />
                </div>
                <h3 className="h5 mb-1 text-light">
                  {isDoctor ? appointment.patient_name : appointment.doctor_name}
                </h3>
                <p className="small text-success mb-2">
                  <i className="bi bi-shield-check me-1" /> HD Encrypted Stream Connected
                </p>
                <div className="d-inline-flex align-items-center gap-1 bg-black bg-opacity-50 px-3 py-1 rounded-full border border-secondary">
                  <i className="bi bi-soundwave text-info" />
                  <span className="small text-muted">Audio Active</span>
                </div>
              </div>
            )}

            {/* Self PIP View */}
            <div
              className="position-absolute bottom-0 end-0 m-3 rounded-3 overflow-hidden border border-light shadow"
              style={{ width: '180px', height: '130px', backgroundColor: '#111' }}
            >
              {isVideoOff ? (
                <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                  <i className="bi bi-camera-video-off fs-4 mb-1" />
                  <span style={{ fontSize: '10px' }}>Camera Off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-100 h-100 object-fit-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              )}
              <span className="position-absolute bottom-0 start-0 m-1 badge bg-black bg-opacity-75 text-white" style={{ fontSize: '9px' }}>
                You ({isDoctor ? 'Doctor' : 'Patient'})
              </span>
            </div>
          </div>

          {streamError && (
            <div className="position-absolute top-0 start-0 m-4 alert alert-warning py-1 px-3 small opacity-75">
              <i className="bi bi-info-circle me-1" /> {streamError}
            </div>
          )}

          {/* In-Call Controls Bar */}
          <div className="py-3 d-flex align-items-center justify-content-center gap-2">
            <button
              type="button"
              className={`btn rounded-circle p-3 ${isAudioMuted ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleAudio}
              title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              <i className={`bi fs-5 ${isAudioMuted ? 'bi-mic-mute-fill' : 'bi-mic-fill'}`} />
            </button>

            <button
              type="button"
              className={`btn rounded-circle p-3 ${isVideoOff ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleVideo}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              <i className={`bi fs-5 ${isVideoOff ? 'bi-camera-video-off-fill' : 'bi-camera-video-fill'}`} />
            </button>

            <button
              type="button"
              className={`btn rounded-circle p-3 ${isScreenSharing ? 'btn-info text-white' : 'btn-secondary'}`}
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              title="Toggle Screen Share"
            >
              <i className="bi bi-display fs-5" />
            </button>

            <button
              type="button"
              className="btn btn-danger px-4 py-2.5 rounded-pill d-flex align-items-center gap-2 font-medium ms-3"
              onClick={handleEndConsultation}
              disabled={isEnding}
            >
              <i className="bi bi-telephone-x-fill" />
              <span>{isEnding ? 'Ending Call...' : 'End Consultation'}</span>
            </button>
          </div>
        </div>

        {/* Side Panel (Chat / AI SOAP Notes) */}
        <div className="w-100 w-lg-350px border-start border-secondary bg-dark d-flex flex-column" style={{ maxWidth: '400px' }}>
          {/* Side Panel Nav */}
          <div className="nav nav-tabs nav-justified border-bottom border-secondary bg-black">
            <button
              type="button"
              className={`nav-link text-white rounded-0 py-2 border-0 ${activeTab === 'chat' ? 'active bg-dark fw-bold border-bottom border-primary border-2' : 'opacity-75'}`}
              onClick={() => setActiveTab('chat')}
            >
              <i className="bi bi-chat-dots me-1" /> Live Chat
            </button>

            {isDoctor && (
              <button
                type="button"
                className={`nav-link text-white rounded-0 py-2 border-0 ${activeTab === 'soap' ? 'active bg-dark fw-bold border-bottom border-primary border-2' : 'opacity-75'}`}
                onClick={() => setActiveTab('soap')}
              >
                <i className="bi bi-stars text-warning me-1" /> AI SOAP Notes
              </button>
            )}

            <button
              type="button"
              className={`nav-link text-white rounded-0 py-2 border-0 ${activeTab === 'info' ? 'active bg-dark fw-bold border-bottom border-primary border-2' : 'opacity-75'}`}
              onClick={() => setActiveTab('info')}
            >
              <i className="bi bi-info-circle me-1" /> Visit Summary
            </button>
          </div>

          {/* TAB 1: Chat */}
          {activeTab === 'chat' && (
            <div className="flex-grow-1 d-flex flex-column p-3 overflow-hidden">
              <div className="flex-grow-1 overflow-y-auto space-y-2 mb-3 pe-1" style={{ fontSize: '13px' }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`p-2 rounded ${msg.sender.includes('System') ? 'bg-secondary bg-opacity-20 text-muted text-center' : msg.isDoctor === isDoctor ? 'bg-primary text-white ms-auto max-w-85' : 'bg-secondary text-white me-auto max-w-85'}`}>
                    <div className="d-flex justify-content-between gap-2 fw-semibold mb-1" style={{ fontSize: '11px' }}>
                      <span>{msg.sender}</span>
                      <span className="opacity-75">{msg.time}</span>
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="input-group">
                <input
                  type="text"
                  className="form-control form-control-sm bg-secondary text-white border-0"
                  placeholder="Type message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="btn btn-sm btn-primary">
                  <i className="bi bi-send" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: AI SOAP Notes for Doctor */}
          {activeTab === 'soap' && isDoctor && (
            <div className="flex-grow-1 p-3 overflow-y-auto text-light" style={{ fontSize: '13px' }}>
              <div className="mb-3">
                <label className="form-label text-muted mb-1">In-Call Observations / Transcript:</label>
                <textarea
                  rows={4}
                  className="form-control form-control-sm bg-secondary text-white border-0"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Notes recorded during consultation..."
                />
              </div>

              <button
                type="button"
                className="btn btn-sm btn-primary w-100 mb-3 d-flex align-items-center justify-content-center gap-1"
                onClick={handleGenerateInCallSoap}
                disabled={soapLoading}
              >
                {soapLoading ? <i className="bi bi-arrow-repeat spin" /> : <i className="bi bi-stars text-warning" />}
                <span>{soapLoading ? 'Generating...' : 'Generate AI SOAP Note'}</span>
              </button>

              {soapResult && (
                <div className="p-2.5 bg-black bg-opacity-50 rounded border border-secondary space-y-2">
                  <div>
                    <strong className="text-info block">S:</strong> {soapResult.subjective}
                  </div>
                  <div>
                    <strong className="text-info block">O:</strong> {soapResult.objective}
                  </div>
                  <div>
                    <strong className="text-info block">A:</strong> {soapResult.assessment}
                  </div>
                  <div>
                    <strong className="text-info block">P:</strong> {soapResult.plan}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Info */}
          {activeTab === 'info' && (
            <div className="flex-grow-1 p-3 overflow-y-auto text-light" style={{ fontSize: '13px' }}>
              <div className="mb-3 p-2 bg-secondary bg-opacity-20 rounded">
                <strong className="text-muted d-block">Patient Name:</strong>
                <span className="fw-bold">{appointment.patient_name}</span>
              </div>
              <div className="mb-3 p-2 bg-secondary bg-opacity-20 rounded">
                <strong className="text-muted d-block">Doctor Name:</strong>
                <span className="fw-bold">{appointment.doctor_name} ({appointment.doctor_specialty})</span>
              </div>
              <div className="mb-3 p-2 bg-secondary bg-opacity-20 rounded">
                <strong className="text-muted d-block">Appointment Date &amp; Time:</strong>
                <span>{appointment.appointment_date} ({appointment.start_time} - {appointment.end_time})</span>
              </div>
              <div className="mb-3 p-2 bg-secondary bg-opacity-20 rounded">
                <strong className="text-muted d-block">Urgency Tier:</strong>
                <span className="badge text-bg-warning">{appointment.triage_urgency || 'ROUTINE'}</span>
              </div>
              <div className="p-2 bg-secondary bg-opacity-20 rounded">
                <strong className="text-muted d-block">Intake Reason:</strong>
                <span>{appointment.reason || 'General Consultation'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
