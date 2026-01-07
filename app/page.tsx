'use client';

import { useState } from 'react';

type LogEntry = {
  time: string;
  context: string;
  level: string;
  message: string;
  data?: Record<string, unknown>;
};

type DemoDisabledMessage = {
  title: string;
  instructions: string[];
};

export default function HomePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [demoDisabledMessage, setDemoDisabledMessage] = useState<DemoDisabledMessage | null>(null);

  const triggerDemo = async () => {
    setLogs([]);
    setDemoDisabledMessage(null);
    setIsRunning(true);

    // First check if demo mode is enabled
    try {
      const statusRes = await fetch('/api/gong-webhook');
      const status = await statusRes.json();
      if (!status.demoMode) {
        setDemoDisabledMessage({
          title: 'Demo mode is not enabled',
          instructions: [
            '1. Set DEMO_MODE=true in your .env file',
            '2. Redeploy the application',
          ],
        });
        setIsRunning(false);
        return;
      }
    } catch {
      // Continue if status check fails
    }

    const timeout = setTimeout(() => {
      setIsRunning(false);
    }, 120000); // 2 min fallback timeout

    try {
      const res = await fetch('/api/gong-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({}),
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
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
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
      }
    } catch (err) {
      console.error('Stream error:', err);
    } finally {
      clearTimeout(timeout);
      setIsRunning(false);
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', { hour12: false });
  };

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

      <button
        onClick={triggerDemo}
        disabled={isRunning}
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
        {demoDisabledMessage ? (
          <div style={{ color: '#f59e0b', textAlign: 'center', paddingTop: '80px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
              {demoDisabledMessage.title}
            </div>
            <div style={{ color: '#888', textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              {demoDisabledMessage.instructions.map((instruction, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>{instruction}</div>
              ))}
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', paddingTop: '100px' }}>
            Click &quot;Test with mocked data&quot; to see logs stream here
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
