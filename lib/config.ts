import { z } from 'zod';

/**
 * Default system prompt for the Sales Call Summary Agent. This can be customized via the AGENT_SYSTEM_PROMPT environment variable.
 */
const DEFAULT_SYSTEM_PROMPT = `You are an expert sales call analyst that reviews call transcripts and provides actionable insights.

Your task: Review the call context and use the tools to gather additional information before writing the summary. Then write a summary and extract objections, tasks, and key insights.

You have access to multiple tools for exploring call context:
1. **bash** - Execute shell commands to search and explore call transcript files

## Filesystem structure will be provided in context

## Writing messages:
For writing summaries, use this structure:

Headline statement (1-2 sentences) to establish the context.
Then, provide a short section expanding on key discussion points:

*{POINT_NAME}*
- Goal: one sentence describing the objective
- Key Insight: one sentence outlining what was discussed
- Concerns/Risks: one sentence summarizing concerns or blockers

Finish with Next Steps calling out the action items and the owners.

## Objections and scoring:
When you identify an objection, score it on a scale of 0 to 100 based on how well it was handled:
- 0-50: Objection was not handled sufficiently
- 51-70: Objection was partially handled
- 71-90: Objection was well handled
- 91-100: Objection was perfectly handled`;

/**
 * Agent output schema - defines the structure of the agent's response.
 * Customize this to match your needs.
 */
export const agentOutputSchema = z.object({
  summary: z.string().describe('A comprehensive summary of the call'),
  tasks: z
    .array(
      z.object({
        taskDescription: z.string(),
        taskOwner: z.string(),
        ownerCompany: z.enum(['internal', 'customer', 'partner']),
      }),
    )
    .describe('List of follow up tasks that should be completed'),
  objections: z
    .array(
      z.object({
        description: z.string(),
        quote: z.string(),
        speaker: z.string(),
        speakerCompany: z.enum(['internal', 'customer', 'partner']),
        handled: z.boolean().describe('Whether the objection has been handled'),
        handledAnswer: z
          .string()
          .describe('The answer given to handle the objection'),
        handledScore: z
          .number()
          .describe('Score of how well the objection was handled (0-100)'),
        handledBy: z
          .string()
          .describe('The name of the person who handled the objection'),
      }),
    )
    .describe('List of objections raised during the call'),
  slackSummary: z
    .string()
    .describe('A quick TL;DR suitable for posting to Slack'),
  slackDetails: z
    .string()
    .describe('Additional details to post as a thread reply'),
});

export type AgentOutput = z.infer<typeof agentOutputSchema>;

/**
 * Playbook configuration - optional feature for categorizing calls.
 * Define your own playbooks to match different call types.
 */
export interface Playbook {
  name: string;
  triggers: string | null;
  description?: string;
}

/**
 * Centralized configuration for the Sales Call Summary Agent.
 * All settings can be configured via environment variables.
 */
export const config = {
  // Company name - used in prompts and messaging
  companyName: process.env.COMPANY_NAME || 'Your Company',

  // AI Model configuration
  model: process.env.AI_MODEL || 'anthropic/claude-sonnet-4-20250514',
  systemPrompt: process.env.AGENT_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT,

  // Gong API configuration
  gong: {
    baseUrl: process.env.GONG_BASE_URL || 'https://api.gong.io',
    accessKey: process.env.GONG_ACCESS_KEY || '',
    secretKey: process.env.GONG_SECRET_KEY || '',
  },

  // Optional: Slack notifications
  // Configure a single channel for summaries - extend for multiple channels as needed
  slack: {
    enabled: !!process.env.SLACK_BOT_TOKEN,
    botToken: process.env.SLACK_BOT_TOKEN || '',
    // Single configurable channel - to add multiple channels, modify sendSlackSummary
    channelId: process.env.SLACK_CHANNEL_ID || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  },

  // Optional: Salesforce CRM integration
  salesforce: {
    enabled: !!process.env.SF_CLIENT_ID,
    clientId: process.env.SF_CLIENT_ID || '',
    username: process.env.SF_USERNAME || '',
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
    privateKeyPem: process.env.SF_PRIVATE_KEY_PEM || '',
  },

  // Optional: Playbooks for call categorization
  // Define your own playbooks or load from JSON
  playbooks: [] as Playbook[],

  // Demo mode configuration
  // When enabled, uses mock Gong data instead of real API calls
  demo: {
    enabled: process.env.DEMO_MODE === 'true',
  },

  // Sandbox configuration
  sandbox: {
    timeout: '10m' as const, // Sandbox timeout duration
  },
};

/**
 * Validate required configuration
 * In demo mode, Gong credentials are not required
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Skip Gong credential validation in demo mode
  if (!config.demo.enabled) {
    if (!config.gong.accessKey) {
      errors.push('GONG_ACCESS_KEY is required');
    }
    if (!config.gong.secretKey) {
      errors.push('GONG_SECRET_KEY is required');
    }
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    errors.push('ANTHROPIC_API_KEY or OPENAI_API_KEY is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

