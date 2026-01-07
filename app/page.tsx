/**
 * Landing Page - Sales Call Summary Agent
 *
 * Minimalist landing page for the Sales Call Summary Agent.
 */

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      {/* Heading */}
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 600,
          fontStyle: 'italic',
          margin: 0,
          marginBottom: '16px',
          letterSpacing: '-0.02em',
        }}
      >
        Sales Call Summary Agent
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '1.1rem',
          color: '#666',
          margin: 0,
          marginBottom: '48px',
          textAlign: 'center',
        }}
      >
        AI-powered call summaries using{' '}
        <a
          href="https://vercel.com/docs/vercel-sandbox"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#666', textDecoration: 'underline' }}
        >
          Vercel Sandbox
        </a>{' '}
        and{' '}
        <a
          href="https://sdk.vercel.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#666', textDecoration: 'underline' }}
        >
          AI SDK
        </a>
      </p>

      {/* Integrations */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '16px',
        }}
      >
        <IntegrationBadge name="Gong" />
        <IntegrationBadge name="Slack" />
        <IntegrationBadge name="Salesforce" />
      </div>

      {/* Alternative Text */}
      <p
        style={{
          fontSize: '0.9rem',
          color: '#888',
          margin: 0,
          marginBottom: '48px',
          textAlign: 'center',
        }}
      >
        Or alternative integrations
      </p>

      {/* Status Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e5e5',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Webhook Endpoint */}
        <div>
          <div
            style={{
              fontSize: '0.8rem',
              color: '#888',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Webhook Endpoint
          </div>
          <code
            style={{
              display: 'block',
              backgroundColor: '#f5f5f5',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#333',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            }}
          >
            POST /api/gong-webhook
          </code>
        </div>
      </div>

      {/* Footer Links */}
      <div
        style={{
          marginTop: '32px',
          display: 'flex',
          gap: '24px',
          fontSize: '0.9rem',
        }}
      >
        <a
          href="https://github.com/vercel-labs/call-summary-agent-with-sandbox"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#888', textDecoration: 'none' }}
        >
          GitHub
        </a>
        <a
          href="https://github.com/vercel-labs/call-summary-agent-with-sandbox/tree/main?tab=readme-ov-file#sales-call-summary-agent"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#888', textDecoration: 'none' }}
        >
          Docs
        </a>
      </div>
    </main>
  );
}

function IntegrationBadge({
  name,
}: {
  name: string;
}) {
  return (
    <span style={{ fontSize: '0.9rem', color: '#555' }}>{name}</span>
  );
}
