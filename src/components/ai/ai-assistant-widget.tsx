'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '👋 Hello! I am **PulseBot**, your 24/7 AI Telehealth Assistant. How can I help you today?',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages([...newMessages, { role: 'assistant', content: data.message }]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content:
              '⚠️ I could not process your query right now. If you have an urgent medical concern, please seek immediate emergency care.',
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '⚠️ Network connection issue. Please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Check my symptom urgency',
    'How do virtual consultations work?',
    'What should I prepare for my visit?',
    'When should I call 112 emergency?',
  ];

  return (
    <div className="position-fixed bottom-0 end-0 m-4 z-3" style={{ zIndex: 1050 }}>
      {/* Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn btn-primary rounded-pill shadow-lg px-3 py-2.5 d-flex align-items-center gap-2 border-0"
          aria-label="Open AI Assistant"
        >
          <i className="bi bi-stars text-warning fs-5" />
          <span className="fw-semibold">AI Health Assist</span>
          <span className="badge text-bg-warning text-dark font-mono" style={{ fontSize: '10px' }}>
            Kimi
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="card shadow-lg border-0 rounded-4 overflow-hidden d-flex flex-column"
          style={{ width: '360px', height: '520px' }}
        >
          {/* Header */}
          <div className="card-header bg-primary text-white p-3 d-flex align-items-center justify-content-between border-0">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-circle bg-white bg-opacity-20 p-2 d-flex align-items-center justify-content-center">
                <i className="bi bi-stars text-warning fs-5" />
              </div>
              <div>
                <h3 className="h6 mb-0 text-white fw-bold d-flex align-items-center gap-1.5">
                  PulseBot AI <span className="badge text-bg-warning text-dark" style={{ fontSize: '9px' }}>Cloud</span>
                </h3>
                <small className="text-white-50" style={{ fontSize: '11px' }}>24/7 Triage &amp; Telehealth Guide</small>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-close btn-close-white"
              aria-label="Close chat"
            />
          </div>

          {/* Messages area */}
          <div className="card-body p-3 overflow-y-auto flex-grow-1 bg-light" style={{ fontSize: '13px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`d-flex gap-2 mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0 mt-1" style={{ width: '28px', height: '28px' }}>
                    <i className="bi bi-robot" />
                  </div>
                )}
                <div
                  className={`p-2.5 rounded-3 max-w-85 ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-bottom-0'
                      : 'bg-white text-dark border shadow-sm rounded-top-0'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center flex-shrink-0 mt-1" style={{ width: '28px', height: '28px' }}>
                    <i className="bi bi-person-fill" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="d-flex align-items-center gap-2 text-muted small py-1">
                <i className="bi bi-arrow-repeat spin text-primary" />
                <span className="fst-italic">Kimi AI is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length < 3 && (
            <div className="p-2 bg-white border-top d-flex flex-wrap gap-1">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="btn btn-outline-primary btn-sm rounded-pill"
                  style={{ fontSize: '11px' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="card-footer bg-white p-2 border-top">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="input-group"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI anything about your symptoms..."
                className="form-control form-control-sm bg-light"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn btn-sm btn-primary"
              >
                <i className="bi bi-send" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
