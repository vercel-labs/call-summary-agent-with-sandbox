/**
 * Landing Page - Gong Call Summary Agent
 *
 * Minimalist status page showing configuration and integration status.
 */

import { validateConfig, config } from '@/lib/config';

export default function HomePage() {
  const configStatus = validateConfig();

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
        Gong Call Summary Agent
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
        {/* Configuration Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: configStatus.valid ? '#22c55e' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#fff',
            }}
          >
            {configStatus.valid ? '✓' : '✕'}
          </span>
          <span style={{ fontSize: '0.95rem', color: '#333' }}>
            {configStatus.valid
              ? 'Configuration valid'
              : `Configuration error: ${configStatus.errors.join(', ')}`}
          </span>
        </div>

        {/* Integrations */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <IntegrationBadge
            name="Gong"
            enabled={!!config.gong.accessKey}
          />
          <IntegrationBadge
            name="Slack"
            enabled={config.slack.enabled}
            optional
          />
          <IntegrationBadge
            name="Salesforce"
            enabled={config.salesforce.enabled}
            optional
          />
        </div>

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
          href="https://github.com/vercel/ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#888', textDecoration: 'none' }}
        >
          GitHub
        </a>
        <a
          href="https://sdk.vercel.ai/docs"
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
  enabled,
  optional = false,
}: {
  name: string;
  enabled: boolean;
  optional?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: enabled ? '#22c55e' : optional ? '#d4d4d4' : '#ef4444',
        }}
      />
      <span style={{ fontSize: '0.9rem', color: '#555' }}>{name}</span>
    </div>
  );
}
