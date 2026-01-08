'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    fetch('/api/gong-webhook')
      .then((res) => res.json())
      .then((status) => setIsDemoMode(status.demoMode))
      .catch(() => setIsDemoMode(true));
  }, []);

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

  const levelColor = (level: string) => {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 600, fontStyle: 'italic', margin: 0, marginBottom: '16px', letterSpacing: '-0.02em' }}>
        Sales Call Summary Agent
      </h1>

      <p style={{ fontSize: '1.1rem', color: '#666', margin: 0, marginBottom: '32px', textAlign: 'center' }}>
        AI-powered call summaries using{' '}
        <a href="https://vercel.com/docs/vercel-sandbox" target="_blank" rel="noopener noreferrer" style={{ color: '#666', textDecoration: 'underline' }}>
          Vercel Sandbox
        </a>{' '}
        and{' '}
        <a href="https://sdk.vercel.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#666', textDecoration: 'underline' }}>
          AI SDK
        </a>
      </p>

      {isDemoMode === false ? (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Enter Gong Call ID"
            value={callId}
            onChange={(e) => setCallId(e.target.value)}
            disabled={isRunning}
            style={{
              padding: '12px 16px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              width: '240px',
            }}
          />
          <button
            onClick={runWorkflow}
            disabled={isRunning || !callId.trim()}
            style={{
              backgroundColor: isRunning || !callId.trim() ? '#ccc' : '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: isRunning || !callId.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      ) : (
        <button
          onClick={runWorkflow}
          disabled={isRunning || isDemoMode === null}
          style={{
            backgroundColor: isRunning ? '#ccc' : '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            marginBottom: '24px',
          }}
        >
          {isRunning ? 'Running...' : 'Test with mocked data'}
        </button>
      )}

      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          backgroundColor: '#1e1e1e',
          borderRadius: '12px',
          padding: '16px',
          minHeight: '300px',
          maxHeight: '500px',
          overflowY: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          fontSize: '0.85rem',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', paddingTop: '100px' }}>
            {isDemoMode === false
              ? 'Enter a Gong Call ID and click "Run" to see logs stream here'
              : 'Click "Test with mocked data" to see logs stream here'}
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '4px', lineHeight: 1.5 }}>
              <span style={{ color: '#666' }}>[{formatTime(log.time)}]</span>{' '}
              <span style={{ color: '#888' }}>[{log.context}]</span>{' '}
              <span style={{ color: levelColor(log.level) }}>{log.message}</span>
              {log.data && Object.keys(log.data).length > 0 && (
                <span style={{ color: '#666' }}> {JSON.stringify(log.data)}</span>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '24px', fontSize: '0.9rem' }}>
        <a href="https://github.com/vercel-labs/call-summary-agent-with-sandbox" target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'none' }}>
          GitHub
        </a>
        <a href="https://github.com/vercel-labs/call-summary-agent-with-sandbox/tree/main?tab=readme-ov-file#sales-call-summary-agent" target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'none' }}>
          Docs
        </a>
      </div>
    </main>
  );
}
