# Gong Call Summary Agent

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fcoding-agent-template&env=GONG_ACCESS_KEY,GONG_SECRET_KEY,ANTHROPIC_API_KEY&envDescription=Required%20API%20keys%20for%20Gong%20and%20AI%20model&project-name=gong-call-summary-agent)

An AI-powered agent that automatically summarizes Gong sales calls using Vercel's Sandbox architecture. The agent analyzes call transcripts and generates structured summaries with objections, action items, and insights.

## Features

- **Structured Summaries** - AI-generated summaries with tasks, objections, and key insights
- **Sandbox Agent** - Uses Vercel Sandbox for secure code execution and file exploration
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
        Exec[executeCommand]
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

| Variable | Required | Description |
|----------|----------|-------------|
| `GONG_ACCESS_KEY` | Yes | Your Gong API access key |
| `GONG_SECRET_KEY` | Yes | Your Gong API secret key |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key (or use `OPENAI_API_KEY`) |
| `SLACK_BOT_TOKEN` | No | Slack bot token for notifications |
| `SLACK_CHANNEL_ID` | No | Slack channel ID for summaries |
| `SF_CLIENT_ID` | No | Salesforce Connected App client ID |
| `SF_USERNAME` | No | Salesforce username |
| `SF_LOGIN_URL` | No | Salesforce login URL |
| `SF_PRIVATE_KEY_PEM` | No | Salesforce private key (PEM format) |

### 3. Configure Gong Webhook

1. Go to your Gong settings > Integrations > Webhooks
2. Create a new webhook with:
   - **URL**: `https://your-app.vercel.app/api/gong-webhook`
   - **Events**: Select "Call completed"
3. Save and test the webhook

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

1. **Webhook Received**: Gong sends call data when a call completes
2. **Workflow Started**: The durable workflow begins processing
3. **Transcript Fetched**: Call transcript is retrieved from Gong API
4. **Sandbox Created**: A secure sandbox is created with call files
5. **Agent Runs**: The AI agent explores transcripts using shell commands
6. **Summary Generated**: Structured output with tasks, objections, insights
7. **Notifications Sent**: Optional Slack messages posted

### Workflow Steps

Each step uses the `"use step"` directive for:
- Automatic retries on failure
- State persistence
- Observability in Vercel dashboard

### Sandbox Tools

The agent has access to shell commands for exploring call transcripts:

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

### Adding Web Search

Uncomment the web search tool in `lib/tools.ts` and configure a search provider (Exa, Tavily, etc.).

### Historical Call Analysis

For analyzing historical calls, integrate with a database:

```typescript
// lib/gong-client.ts - fetchRecentCalls()
// OPTION: For historical call analysis with better performance,
// integrate with Snowflake, PostgreSQL, or another database
```

### Custom Playbooks

Add playbook detection by configuring `config.playbooks` in `lib/config.ts`.

### CRM Customization

The agent supports optional CRM integration to enrich call context. By default, Salesforce is supported, but you can customize fields or add other CRMs.

#### Customizing Salesforce Fields

Modify the SOQL query in `lib/salesforce.ts` → `getAccountData()`:

```typescript
// Add custom fields to the query
const accountQueryResult = await querySalesforce({
  query: `SELECT Id, Name, Website, Industry, Type, 
          AnnualRevenue, NumberOfEmployees, Custom_Field__c 
          FROM Account WHERE Id = '${accountId}'`,
  instanceUrl,
  accessToken,
});
```

To include related objects (opportunities, contacts):

```typescript
// Add opportunity query
const oppQueryResult = await querySalesforce({
  query: `SELECT Id, Name, Amount, StageName, CloseDate 
          FROM Opportunity 
          WHERE AccountId = '${accountId}' 
          ORDER BY CloseDate DESC LIMIT 5`,
  instanceUrl,
  accessToken,
});
```

Update `lib/sandbox-context.ts` → `formatAccountMarkdown()` to include the new fields in the agent's context.

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
gong-call-summary-agent/
├── app/
│   ├── api/gong-webhook/    # Webhook endpoint
│   ├── layout.tsx
│   └── page.tsx             # Status page
├── lib/
│   ├── agent.ts             # ToolLoopAgent configuration
│   ├── config.ts            # Centralized configuration
│   ├── gong-client.ts       # Gong API helpers
│   ├── salesforce.ts        # Optional Salesforce integration
│   ├── slack.ts             # Optional Slack integration
│   ├── sandbox-context.ts   # File generation for sandbox
│   ├── tools.ts             # Agent tools (executeCommand)
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

**Request Body**: Gong webhook payload (see [Gong Webhooks](https://gong.io/developers/webhooks))

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
  "service": "gong-call-summary-agent",
  "configValid": true,
  "configErrors": []
}
```

## Output
The function returns output in the format agentOutputSchema (detailed in agent.ts). You can save this output in Slack.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
