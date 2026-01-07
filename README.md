# Sales Call Summary Agent

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fcoding-agent-template&env=GONG_ACCESS_KEY,GONG_SECRET_KEY,ANTHROPIC_API_KEY&envDescription=Required%20API%20keys%20for%20Gong%20and%20AI%20model&project-name=gong-call-summary-agent)

An AI-powered agent that automatically summarizes sales calls using Vercel's Sandbox architecture. The agent analyzes call transcripts and generates structured summaries with objections, action items, and insights.

> **Template Note**: This template uses **Gong** as a starting example for call transcript integration. You can adapt it to work with other call recording platforms (Zoom, Google Meet, etc.) by modifying the webhook handler and transcript fetching logic.

## Features

- **Structured Summaries** - AI-generated summaries with tasks, objections, and key insights
- **Sandbox Agent** - Uses Vercel Sandbox for secure code execution and file exploration
- **[bash-tool](https://www.npmjs.com/package/bash-tool)** - Generic bash tool for AI agents, compatible with AI SDK
- **Demo Mode** - Test the full agent flow with mock data, no API keys required
- **Objection Tracking** - Identifies and scores how well objections were handled
- **Slack Integration** - Optional notifications to your team channel
- **Salesforce Integration** - Optional CRM context enrichment
- **Durable Workflows** - Built with Vercel Workflow DevKit for reliability

## Architecture

```mermaid
flowchart TD
    subgraph entry [Entry Point]
        Webhook[POST /api/gong-webhook]
    end

    subgraph workflow [Workflow Layer]
        WF["workflowGongSummary<br/>(use workflow)"]
        Steps["Workflow Steps<br/>(use step)"]
    end

    subgraph agent [Agent Layer]
        Agent[ToolLoopAgent]
        Sandbox[Vercel Sandbox]
    end

    subgraph tools [Sandbox Tools]
        Bash[bash-tool]
    end

    subgraph external [External Services]
        Gong[Gong API]
        SF[Salesforce - Optional]
        Slack[Slack - Optional]
    end

    Webhook --> WF
    WF --> Steps
    Steps --> Agent
    Agent --> Sandbox
    Agent --> tools
    Steps --> Gong
    Steps --> SF
    Steps --> Slack
```

## Quick Start

### 1. Deploy to Vercel

Click the "Deploy with Vercel" button above, or:

```bash
git clone https://github.com/your-org/gong-call-summary-agent
cd gong-call-summary-agent
vercel
```

### 2. Configure Environment Variables

Set the following environment variables in your Vercel project:

#### Required

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (or use `OPENAI_API_KEY` instead) |

#### Required for Production (skip for Demo Mode)

| Variable | Description |
|----------|-------------|
| `GONG_ACCESS_KEY` | Your Gong API access key |
| `GONG_SECRET_KEY` | Your Gong API secret key |

#### Optional

| Variable | Description |
|----------|-------------|
| `DEMO_MODE` | Set to `true` to use mock data instead of real Gong API |
| `COMPANY_NAME` | Your company name (default: "Your Company") |
| `AI_MODEL` | AI model to use (default: `anthropic/claude-sonnet-4-20250514`) |
| `SLACK_BOT_TOKEN` | Slack bot token for notifications |
| `SLACK_CHANNEL_ID` | Slack channel ID for summaries |
| `SF_CLIENT_ID` | Salesforce Connected App client ID |
| `SF_USERNAME` | Salesforce username |
| `SF_LOGIN_URL` | Salesforce login URL |
| `SF_PRIVATE_KEY_PEM` | Salesforce private key (PEM format) |

### 3. Configure Gong Webhook (Production Mode)

1. Go to your Gong settings > Integrations > Webhooks
2. Create a new webhook with:
   - **URL**: `https://your-app.vercel.app/api/gong-webhook`
   - **Events**: Select "Call completed"
3. Save and test the webhook

## Demo Mode

Demo mode allows you to test the full agent workflow without Gong API credentials. It uses realistic mock data including:

- A sample product demo call transcript
- Historical call transcripts (discovery call, intro call)
- Salesforce records (account, opportunity, contacts)
- Company research and competitive intelligence
- Sales playbook

### Enable Demo Mode

Set the environment variable:

```bash
DEMO_MODE=true
```

### Test Demo Mode

1. **Check configuration:**
   ```bash
   curl https://your-app.vercel.app/api/gong-webhook
   ```
   Response should include `"demoMode": true`

2. **Trigger the webhook:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/gong-webhook \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   The empty body is fine - mock data is used automatically in demo mode.

3. **View logs** in the Vercel dashboard to see the agent processing the call.

### Demo Mode Files

In demo mode, the sandbox is populated with 10 context files:

| Path | Description |
|------|-------------|
| `gong-calls/demo-call-001-*.md` | Current call transcript |
| `gong-calls/metadata.json` | Call metadata |
| `gong-calls/previous/demo-call-000-discovery-call.md` | Previous discovery call |
| `gong-calls/previous/demo-call-intro-initial-call.md` | Initial intro call |
| `salesforce/account.md` | Salesforce account record |
| `salesforce/opportunity.md` | Salesforce opportunity |
| `salesforce/contacts.md` | Salesforce contacts |
| `research/company-research.md` | Company background |
| `research/competitive-intel.md` | Competitive analysis |
| `playbooks/sales-playbook.md` | Sales playbook |

## Configuration

### AI Model

By default, the agent uses `claude-sonnet-4-20250514`. You can change this via:

```bash
AI_MODEL=anthropic/claude-opus-4-20250514
# or
AI_MODEL=openai/gpt-4o
```

### Custom System Prompt

Override the default system prompt:

```bash
AGENT_SYSTEM_PROMPT="You are a sales call analyst..."
```

### Slack Integration

Enable Slack notifications by setting:

```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL_ID=C0123456789
```

The agent posts:
1. Main summary message
2. Thread reply with details
3. Objections breakdown
4. Action items list

**To add multiple channels**: Modify `lib/slack.ts` to route based on call properties.

### Salesforce Integration

Enable CRM context by setting Salesforce credentials. The agent will enrich summaries with account data.

See [CRM Customization](#crm-customization) for details on customizing fields or adding other CRMs.

## How It Works

1. **Webhook Received**: Gong sends call data when a call completes (or mock data in demo mode)
2. **Workflow Started**: The durable workflow begins processing
3. **Transcript Fetched**: Call transcript is retrieved from Gong API (or mock data)
4. **Sandbox Created**: A secure sandbox is created with call files
5. **Agent Runs**: The AI agent explores transcripts using [bash-tool](https://www.npmjs.com/package/bash-tool)
6. **Summary Generated**: Structured output with tasks, objections, insights
7. **Notifications Sent**: Optional Slack messages posted

### Workflow Steps

Each step uses the `"use step"` directive for:
- Automatic retries on failure
- State persistence
- Observability in Vercel dashboard

### Sandbox Tools

The agent uses [bash-tool](https://www.npmjs.com/package/bash-tool) for exploring call transcripts via shell commands:

```bash
# List call files
ls gong-calls/

# Search for pricing discussions
grep -r "pricing" gong-calls/

# View call metadata
cat gong-calls/metadata.json

# Find objections
grep -i "concern\|issue\|problem" gong-calls/*.md
```

All bash commands are logged for observability:
```
[bash-tool] INFO: Bash command starting { command: 'grep -r "pricing" gong-calls/' }
[bash-tool] INFO: Bash command completed { command: '...', exitCode: 0, stdoutLength: 605 }
```

## Output Schema

The agent generates structured output:

```typescript
{
  summary: string,           // Comprehensive call summary
  tasks: [{
    taskDescription: string,
    taskOwner: string,
    ownerCompany: 'internal' | 'customer' | 'partner'
  }],
  objections: [{
    description: string,
    quote: string,
    speaker: string,
    speakerCompany: string,
    handled: boolean,
    handledAnswer: string,
    handledScore: number,    // 0-100
    handledBy: string
  }],
  slackSummary: string,      // TL;DR for Slack
  slackDetails: string       // Detailed thread reply
}
```

## Customization

### Custom Playbooks

Add playbook detection by configuring `config.playbooks` in `lib/config.ts`.

### CRM Customization

The agent supports optional CRM integration to enrich call context. By default, Salesforce is supported, but you can customize fields or add other CRMs.

#### Adding a Different CRM (HubSpot, Pipedrive, etc.)

1. **Create a new CRM module** (e.g., `lib/hubspot.ts`):

```typescript
export function isHubSpotEnabled(): boolean {
  return !!process.env.HUBSPOT_API_KEY;
}

export async function getAccountData(companyId: string): Promise<{
  accountData: Record<string, unknown> | null;
}> {
  // Implement your CRM's API calls
}
```

2. **Add config** in `lib/config.ts`:

```typescript
hubspot: {
  enabled: !!process.env.HUBSPOT_API_KEY,
  apiKey: process.env.HUBSPOT_API_KEY || '',
},
```

3. **Update sandbox context** in `lib/sandbox-context.ts`:

```typescript
import { getAccountData, isHubSpotEnabled } from './hubspot';

// In generateFilesForSandbox():
if (isHubSpotEnabled() && options.hubspotCompanyId) {
  const { accountData } = await getAccountData(options.hubspotCompanyId);
  // Write to sandbox...
}
```

4. **Extract CRM IDs from Gong context** in `workflows/gong-summary/index.ts`:

```typescript
// Gong may include CRM context from integrations
const hubspotCompanyId = data.callData.context
  ?.find((c) => c.system === 'HubSpot')
  ?.objects?.find((o) => o.objectType === 'Company')?.objectId;
```

#### Disabling CRM Integration

Simply don't set the `SF_*` environment variables. The integration checks `isSalesforceEnabled()` before making any API calls.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
sales-call-summary-agent/
├── app/
│   ├── api/gong-webhook/    # Webhook endpoint
│   ├── layout.tsx
│   └── page.tsx             # Status page
├── lib/
│   ├── agent.ts             # ToolLoopAgent configuration
│   ├── config.ts            # Centralized configuration
│   ├── gong-client.ts       # Gong API helpers
│   ├── mock-data.ts         # Demo mode mock data
│   ├── salesforce.ts        # Optional Salesforce integration
│   ├── slack.ts             # Optional Slack integration
│   ├── sandbox-context.ts   # File generation for sandbox
│   ├── tools.ts             # Agent tools (bash-tool)
│   ├── types.ts             # TypeScript types
│   └── logger.ts            # Logging utility
└── workflows/
    └── gong-summary/
        ├── index.ts         # Main workflow
        └── steps.ts         # Workflow steps
```

## API Reference

### POST /api/gong-webhook

Receives Gong webhook payloads and triggers the summary workflow.

**Request Body**: Gong webhook payload or empty `{}` in demo mode.

**Response**:
```json
{
  "message": "Workflow triggered",
  "callId": "1234567890"
}
```

### GET /api/gong-webhook

Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "service": "sales-call-summary-agent",
  "demoMode": false,
  "configValid": true,
  "configErrors": []
}
```

## Output
The function returns output in the format agentOutputSchema (detailed in agent.ts). You can save this output in Slack.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
