'use client';

import { useState, useEffect, useRef } from 'react';

type LogEntry = {
  time: string;
  context: string;
  level: string;
  message: string;
  data?: Record<string, unknown>;
};

export default function HomePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean | null>(null);
  const [callId, setCallId] = useState('');
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/gong-webhook')
      .then((res) => res.json())
      .then((status) => setIsDemoMode(status.mode === 'demo'))
      .catch(() => setIsDemoMode(true));
  }, []);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const runWorkflow = async () => {
    if (!isDemoMode && !callId.trim()) return;

    setLogs([]);
    setIsRunning(true);

    const timeout = setTimeout(() => setIsRunning(false), 120000);

    try {
      const body = isDemoMode
        ? {}
        : { callData: { metaData: { id: callId.trim(), title: 'Test Call' } } };

      const res = await fetch('/api/gong-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(body),
      });

      const reader = res.body?.getReader();
      if (!reader) {
        setIsRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '"[DONE]"' || data === '[DONE]') {
              setIsRunning(false);
              continue;
            }
            try {
              const log = JSON.parse(data) as LogEntry;
              setLogs((prev) => [...prev, log]);

              if (log.context === 'workflow' && log.message === 'Workflow complete') {
                setIsRunning(false);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }

        if (done) break;
      }
    } catch (err) {
      console.error('Stream error:', err);
    } finally {
      clearTimeout(timeout);
      setIsRunning(false);
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour12: false });

  const contextColor = (context: string) => {
    switch (context) {
      case 'workflow': return { bg: '#2e1065', text: '#c4b5fd' };
      case 'agent': return { bg: '#022c22', text: '#6ee7b7' };
      case 'bash': return { bg: '#1c1917', text: '#a8a29e' };
      case 'bash-output': return { bg: '#1c1917', text: '#78716c' };
      case 'sandbox': return { bg: '#172554', text: '#93c5fd' };
      case 'transcript': return { bg: '#3f3f46', text: '#a1a1aa' };
      case 'result': return { bg: '#365314', text: '#bef264' };
      case 'slack': return { bg: '#4a1d6e', text: '#e879f9' };
      default: return { bg: '#27272a', text: '#a1a1aa' };
    }
  };

  const levelIcon = (level: string) => {
    switch (level) {
      case 'error': return '✕';
      case 'warn': return '!';
      default: return '›';
    }
  };

  const levelColor = (level: string) => {
    switch (level) {
      case 'error': return '#f87171';
      case 'warn': return '#fbbf24';
      default: return '#525252';
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 40px',
      background: 'linear-gradient(to bottom, #000 0%, #0a0a0a 100%)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <svg width="24" height="24" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#fff"/>
        </svg>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 500,
          margin: 0,
          letterSpacing: '-0.02em',
          color: '#fafafa',
        }}>
          Sales Call Summary Agent
        </h1>
        <span style={{
          backgroundColor: '#2e1065',
          color: '#c4b5fd',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '0.7rem',
          fontWeight: 500,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}>
          Demo
        </span>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
      }}>
        {/* Info Cards Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}>
          {/* Overview */}
          <div style={{
            backgroundColor: '#111',
            borderRadius: '10px',
            border: '1px solid #1f1f1f',
            padding: '14px 16px',
          }}>
            <p style={{
              fontSize: '0.65rem',
              color: '#555',
              margin: 0,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}>
              Overview
            </p>
            <p style={{
              fontSize: '0.8rem',
              color: '#888',
              margin: 0,
              lineHeight: 1.5,
            }}>
              An AI agent that analyzes sales call transcripts and generates actionable insights. Built with{' '}
              <a href="https://sdk.vercel.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'underline', textUnderlineOffset: '2px' }}>AI SDK</a>{' '}
              and{' '}
              <a href="https://vercel.com/docs/workflow" target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Workflow</a>.
            </p>
          </div>

          {/* How it works */}
          <div style={{
            backgroundColor: '#111',
            borderRadius: '10px',
            border: '1px solid #1f1f1f',
            padding: '14px 16px',
          }}>
            <p style={{
              fontSize: '0.65rem',
              color: '#555',
              margin: 0,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}>
              How it works
            </p>
            <p style={{
              fontSize: '0.8rem',
              color: '#888',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Spins up an isolated{' '}
              <a href="https://vercel.com/docs/vercel-sandbox" target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'underline', textUnderlineOffset: '2px' }}>sandbox</a>{' '}
              with call data, then uses bash to explore transcripts, grep for key moments, and analyze context.
            </p>
          </div>

          {/* Agent Objective */}
          <div style={{
            backgroundColor: '#111',
            borderRadius: '10px',
            border: '1px solid #1f1f1f',
            padding: '14px 16px',
          }}>
            <p style={{
              fontSize: '0.65rem',
              color: '#555',
              margin: 0,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}>
              Agent Objective
            </p>
            <p style={{
              fontSize: '0.8rem',
              color: '#888',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Extract a structured summary, follow-up tasks with owners, and customer objections with handling scores.
            </p>
          </div>
        </div>

        {/* Run Button */}
        <div style={{ marginBottom: '12px' }}>
          {isDemoMode === false ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter Gong Call ID"
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
                disabled={isRunning}
                style={{
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  backgroundColor: '#0a0a0a',
                  color: '#ededed',
                  width: '220px',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = '#666'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
              />
              <button
                onClick={runWorkflow}
                disabled={isRunning || !callId.trim()}
                style={{
                  backgroundColor: isRunning || !callId.trim() ? '#333' : '#fff',
                  color: isRunning || !callId.trim() ? '#666' : '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: isRunning || !callId.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isRunning && <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #666', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                {isRunning ? 'Running' : 'Run'}
              </button>
            </div>
          ) : (
            <button
              onClick={runWorkflow}
              disabled={isRunning || isDemoMode === null}
              style={{
                backgroundColor: isRunning ? '#333' : '#fff',
                color: isRunning ? '#666' : '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isRunning && <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #666', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
              {isRunning ? 'Running' : 'Run Demo'}
            </button>
          )}
        </div>

        {/* Terminal */}
        <div
          style={{
            backgroundColor: '#0a0a0a',
            borderRadius: '12px',
            border: '1px solid #1f1f1f',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '380px',
            maxHeight: '380px',
          }}
        >
          {/* Terminal Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #1f1f1f',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#333' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#333' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#333' }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '8px' }}>Agent Logs</span>
            {isRunning && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.75rem',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                Live
              </span>
            )}
          </div>

          {/* Terminal Content */}
          <div
            ref={logsContainerRef}
            style={{
              padding: '16px',
              flex: 1,
              overflowY: 'auto',
              fontFamily: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
              fontSize: '0.85rem',
              lineHeight: 1.7,
            }}
          >
            {logs.length === 0 ? (
              <div style={{
                color: '#444',
                textAlign: 'center',
                paddingTop: '130px',
                fontSize: '0.85rem',
              }}>
                {isDemoMode === false
                  ? 'Enter a Gong Call ID and click "Run" to start'
                  : 'Click "Run Demo" to start the agent'}
              </div>
            ) : (
              <>
                {logs.map((log, i) => {
                  const colors = contextColor(log.context);
                  return (
                    <div
                      key={i}
                      style={{
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        animation: 'fadeIn 0.2s ease',
                      }}
                    >
                      <span style={{
                        color: levelColor(log.level),
                        fontWeight: 500,
                        width: '12px',
                        flexShrink: 0,
                      }}>
                        {levelIcon(log.level)}
                      </span>
                      <span style={{ color: '#555', flexShrink: 0 }}>
                        {formatTime(log.time)}
                      </span>
                      <span style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        flexShrink: 0,
                      }}>
                        {log.context}
                      </span>
                      <span style={{
                        color: log.level === 'error' ? '#f87171' : log.level === 'warn' ? '#fbbf24' : '#d4d4d4',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {log.message}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Footer Links */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <a
            href="https://github.com/vercel-labs/call-summary-agent-with-sandbox"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#fafafa',
              color: '#0a0a0a',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e5e5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
          >
            Get started with our template
          </a>
          <a
            href="https://github.com/vercel-labs/call-summary-agent-with-sandbox/tree/main?tab=readme-ov-file#sales-call-summary-agent"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#666',
              fontSize: '0.875rem',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ededed'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            Documentation
          </a>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
