import React, { useEffect, useRef, useState } from 'react';
import './assistant.css';

const GREETING = "Hi! I'm here to help you think through this problem — I won't just hand you the answer, but I'll ask questions and point you in the right direction. What have you tried so far?";

// `context` shape: { problem, code, testSummary }
// - problem: the problem object (title, difficulty, description, constraints, functionName)
// - code: the user's current code in the editor (a live ref, read at send-time)
// - testSummary: a short string like "2 / 4 tests passed" or null
function ChatAssistant({ getContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const { problem, code, testSummary } = getContext();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: {
            title: problem.title,
            difficulty: problem.difficulty,
            description: problem.description,
            constraints: problem.constraints,
            functionName: problem.functionName
          },
          code,
          testSummary,
          messages: nextMessages
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'The assistant is unavailable right now.');
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError('Could not reach the assistant. Is the backend server running?');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={`assistant-widget${open ? ' open' : ''}`}>
      {open && (
        <div className="assistant-panel">
          <div className="assistant-panel-header">
            <span>AI Assistant</span>
            <button className="assistant-close-btn" onClick={() => setOpen(false)} aria-label="Close">
              &times;
            </button>
          </div>
          <div className="assistant-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`assistant-message ${m.role}`}>
                {m.content}
              </div>
            ))}
            {sending && <div className="assistant-message assistant typing">Thinking...</div>}
            {error && <div className="assistant-error">{error}</div>}
          </div>
          <div className="assistant-input-row">
            <textarea
              className="assistant-input"
              placeholder="Ask for a hint... (Enter to send)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              rows={1}
            />
            <button className="assistant-send-btn" onClick={handleSend} disabled={sending || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
      <button className="assistant-fab" onClick={() => setOpen((o) => !o)} aria-label="Toggle AI Assistant">
        {open ? '×' : '💬'}
      </button>
    </div>
  );
}

export default ChatAssistant;
