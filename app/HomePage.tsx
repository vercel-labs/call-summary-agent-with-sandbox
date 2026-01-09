"use client";

import { useState, useEffect, useRef } from "react";

type LogEntry = {
  time: string;
  context: string;
  level: string;
  message: string;
  data?: Record<string, unknown>;
};

export default function HomePage({ isDemo: isDemoMode }: { isDemo: boolean }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [callId, setCallId] = useState("");
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
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
        : { callData: { metaData: { id: callId.trim(), title: "Test Call" } } };

      const res = await fetch("/api/gong-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
      });

      const reader = res.body?.getReader();
      if (!reader) {
        setIsRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === '"[DONE]"' || data === "[DONE]") {
              setIsRunning(false);
              continue;
            }
            try {
              const log = JSON.parse(data) as LogEntry;
              setLogs((prev) => [...prev, log]);

              if (
                log.context === "workflow" &&
                log.message === "Workflow complete"
              ) {
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
      console.error("Stream error:", err);
    } finally {
      clearTimeout(timeout);
      setIsRunning(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour12: false });

  const contextColor = (context: string) => {
    switch (context) {
      case "workflow":
        return { bg: "#2e1065", text: "#c4b5fd" };
      case "agent":
        return { bg: "#022c22", text: "#6ee7b7" };
      case "bash":
        return { bg: "#1c1917", text: "#a8a29e" };
      case "bash-output":
        return { bg: "#1c1917", text: "#78716c" };
      case "sandbox":
        return { bg: "#172554", text: "#93c5fd" };
      case "transcript":
        return { bg: "#3f3f46", text: "#a1a1aa" };
      case "result":
        return { bg: "#365314", text: "#bef264" };
      default:
        return { bg: "#27272a", text: "#a1a1aa" };
    }
  };

  const levelIcon = (level: string) => {
    switch (level) {
      case "error":
        return "✕";
      case "warn":
        return "!";
      default:
        return null;
    }
  };

  const levelColor = (level: string) => {
    switch (level) {
      case "error":
        return "#f87171";
      case "warn":
        return "#fbbf24";
      default:
        return "#525252";
    }
  };

  return (
    <main
      style={{
        height: "100vh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        padding: "32px 40px",
        background: "linear-gradient(to bottom, #000 0%, #0a0a0a 100%)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "24px",
          flexShrink: 0,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 76 65"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#fff" />
        </svg>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 500,
            margin: 0,
            letterSpacing: "-0.02em",
            color: "#fafafa",
          }}
        >
          Sales Call Summary Agent
        </h1>
        <span
          style={{
            backgroundColor: "#2e1065",
            color: "#c4b5fd",
            padding: "4px 10px",
            borderRadius: "9999px",
            fontSize: "0.7rem",
            fontWeight: 500,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          Demo
        </span>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: "900px",
          width: "100%",
          margin: "0 auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* Info Cards Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "16px",
            flexShrink: 0,
          }}
        >
          {/* Overview */}
          <div
            style={{
              backgroundColor: "#111",
              borderRadius: "10px",
              border: "1px solid #1f1f1f",
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                fontSize: "0.65rem",
                color: "#555",
                margin: 0,
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Overview
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#888",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              An AI agent that analyzes sales call transcripts and generates
              actionable insights. Built with{" "}
              <a
                href="https://sdk.vercel.ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#888",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                AI SDK
              </a>{" "}
              and{" "}
              <a
                href="https://vercel.com/docs/workflow"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#888",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Workflow
              </a>
              .
            </p>
          </div>

          {/* How it works */}
          <div
            style={{
              backgroundColor: "#111",
              borderRadius: "10px",
              border: "1px solid #1f1f1f",
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                fontSize: "0.65rem",
                color: "#555",
                margin: 0,
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              How it works
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#888",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Spins up an isolated{" "}
              <a
                href="https://vercel.com/docs/vercel-sandbox"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#888",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                sandbox
              </a>{" "}
              with call data, then uses bash to explore transcripts, grep for
              key moments, and analyze context.
            </p>
          </div>

          {/* Agent Objective */}
          <div
            style={{
              backgroundColor: "#111",
              borderRadius: "10px",
              border: "1px solid #1f1f1f",
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                fontSize: "0.65rem",
                color: "#555",
                margin: 0,
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Agent Objective
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#888",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Extract a structured summary, follow-up tasks with owners, and
              customer objections with handling scores.
            </p>
          </div>
        </div>

        {/* Terminal */}
        <div
          style={{
            backgroundColor: "#0a0a0a",
            borderRadius: "12px",
            border: "1px solid #1f1f1f",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: "200px",
            maxHeight: "800px",
          }}
        >
          {/* Terminal Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #1f1f1f",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#333",
                  }}
                />
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#333",
                  }}
                />
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#333",
                  }}
                />
              </div>
              <span
                style={{ fontSize: "0.8rem", color: "#666", marginLeft: "8px" }}
              >
                Agent Logs
              </span>
            </div>
            <div style={{ flexShrink: 0 }}>
              {isDemoMode === false ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Enter Gong Call ID"
                    value={callId}
                    onChange={(e) => setCallId(e.target.value)}
                    disabled={isRunning}
                    style={{
                      padding: "10px 14px",
                      fontSize: "0.875rem",
                      borderRadius: "8px",
                      border: "1px solid #333",
                      backgroundColor: "#0a0a0a",
                      color: "#ededed",
                      width: "220px",
                      outline: "none",
                      transition: "border-color 0.15s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#666")}
                    onBlur={(e) => (e.target.style.borderColor = "#333")}
                  />
                  <button
                    onClick={runWorkflow}
                    disabled={isRunning || !callId.trim()}
                    style={{
                      backgroundColor:
                        isRunning || !callId.trim() ? "#333" : "#fff",
                      color: isRunning || !callId.trim() ? "#666" : "#000",
                      border: "none",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor:
                        isRunning || !callId.trim() ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {isRunning && (
                      <span
                        style={{
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          border: "2px solid #666",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                    )}

                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {isRunning ? "Running" : "Run"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={runWorkflow}
                  disabled={isRunning || isDemoMode === null}
                  style={{
                    backgroundColor: isRunning ? "#333" : "#fff",
                    color: isRunning ? "#666" : "#000",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: isRunning ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {isRunning && (
                    <span
                      style={{
                        display: "inline-block",
                        width: "12px",
                        height: "12px",
                        border: "2px solid #666",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  )}

                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {isRunning ? "Running" : "Run Demo"}
                </button>
              )}
            </div>
          </div>

          {/* Terminal Content */}
          <div
            ref={logsContainerRef}
            style={{
              padding: "16px",
              flex: 1,
              overflowY: "auto",
              fontFamily:
                'var(--font-geist-mono), ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
              fontSize: "0.85rem",
              lineHeight: 1.7,
            }}
          >
            {logs.length === 0 ? (
              <div
                style={{
                  color: "#444",
                  textAlign: "center",
                  paddingTop: "130px",
                  fontSize: "0.85rem",
                }}
              >
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
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        animation: "fadeIn 0.2s ease",
                      }}
                    >
                      {levelIcon(log.level) && (
                        <span
                          style={{
                            color: levelColor(log.level),
                            fontWeight: 500,
                            width: "12px",
                            flexShrink: 0,
                          }}
                        >
                          {levelIcon(log.level)}
                        </span>
                      )}
                      <span style={{ color: "#555", flexShrink: 0 }}>
                        {formatTime(log.time)}
                      </span>
                      <span
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {log.context}
                      </span>
                      <span
                        style={{
                          color:
                            log.level === "error"
                              ? "#f87171"
                              : log.level === "warn"
                              ? "#fbbf24"
                              : "#d4d4d4",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {log.message}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          flexShrink: 0,
          paddingTop: "24px",
          paddingBottom: "8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* Footer Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
          }}
        >
          <a
            href="https://github.com/vercel-labs/call-summary-agent-with-sandbox"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#a1a1aa",
              fontSize: "0.9rem",
              fontWeight: 500,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 20px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fafafa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub Repository
          </a>

          <span style={{ color: "#333", fontSize: "1.2rem" }}>|</span>

          <a
            href="https://github.com/vercel-labs/call-summary-agent-with-sandbox/tree/main?tab=readme-ov-file#sales-call-summary-agent"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#a1a1aa",
              fontSize: "0.9rem",
              fontWeight: 500,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 20px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fafafa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Documentation
          </a>

          <span style={{ color: "#333", fontSize: "1.2rem" }}>|</span>

          <a
            href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fcall-summary-agent-with-sandbox"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#a1a1aa",
              fontSize: "0.9rem",
              fontWeight: 500,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 20px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fafafa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          >
            <svg width="16" height="16" viewBox="0 0 76 65" fill="currentColor">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            Deploy to Vercel
          </a>
        </div>

        {/* Copyright */}
        <p
          style={{
            color: "#52525b",
            fontSize: "0.85rem",
            margin: 0,
          }}
        >
          © {new Date().getFullYear()} Vercel, Inc. All rights reserved.
        </p>
      </footer>

      {/* Animations */}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
