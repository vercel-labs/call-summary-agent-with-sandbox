/**
 * Centralized configuration for the Sales Call Summary Agent.
 *
 * Environment variables control all settings. Demo mode is automatically
 * enabled when Gong credentials are not provided.
 */

import { z } from 'zod';

/**
 * Returns true if running in demo mode (using mock data instead of real APIs).
 * Demo mode is active when Gong credentials are missing.
 */
export function isDemoMode(): boolean {
  return !process.env.GONG_ACCESS_KEY || !process.env.GONG_SECRET_KEY;
}

/**
 * Application configuration loaded from environment variables.
 */
export const config = {
  companyName: process.env.COMPANY_NAME || 'Your Company',
  model: process.env.AI_MODEL || 'anthropic/claude-haiku-4-5',

  gong: {
    baseUrl: process.env.GONG_BASE_URL || 'https://api.gong.io',
    accessKey: process.env.GONG_ACCESS_KEY || '',
    secretKey: process.env.GONG_SECRET_KEY || '',
  },

  slack: {
    enabled: !!process.env.SLACK_BOT_TOKEN,
    botToken: process.env.SLACK_BOT_TOKEN || '',
    channelId: process.env.SLACK_CHANNEL_ID || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  },

  salesforce: {
    enabled: !!process.env.SF_CLIENT_ID,
    clientId: process.env.SF_CLIENT_ID || '',
    username: process.env.SF_USERNAME || '',
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
    privateKeyPem: process.env.SF_PRIVATE_KEY_PEM || '',
  },

  sandbox: {
    timeout: '10m' as const,
  },
};

// =============================================================================
// SCHEMA DESCRIPTIONS (for AI structured output)
// =============================================================================

const SCHEMA_DESCRIPTIONS = {
  summary: 'A comprehensive summary of the call',
  tasks: 'List of follow up tasks that should be completed',
  objections: 'List of objections raised during the call',
  objectionHandled: 'Whether the objection has been handled',
  objectionHandledAnswer: 'The answer given to handle the objection',
  objectionHandledScore: 'Score of how well the objection was handled (0-100)',
  objectionHandledBy: 'The name of the person who handled the objection',
  slackSummary: 'A quick TL;DR suitable for posting to Slack',
  slackDetails: 'Additional details to post as a thread reply',
};

/**
 * Agent output schema - defines the structure of the agent's response.
 */
export const agentOutputSchema = z.object({
  summary: z.string().describe(SCHEMA_DESCRIPTIONS.summary),
  tasks: z
    .array(
      z.object({
        taskDescription: z.string(),
        taskOwner: z.string(),
        ownerCompany: z.enum(['internal', 'customer', 'partner']),
      })
    )
    .describe(SCHEMA_DESCRIPTIONS.tasks),
  objections: z
    .array(
      z.object({
        description: z.string(),
        quote: z.string(),
        speaker: z.string(),
        speakerCompany: z.enum(['internal', 'customer', 'partner']),
        handled: z.boolean().describe(SCHEMA_DESCRIPTIONS.objectionHandled),
        handledAnswer: z.string().describe(SCHEMA_DESCRIPTIONS.objectionHandledAnswer),
        handledScore: z.number().describe(SCHEMA_DESCRIPTIONS.objectionHandledScore),
        handledBy: z.string().describe(SCHEMA_DESCRIPTIONS.objectionHandledBy),
      })
    )
    .describe(SCHEMA_DESCRIPTIONS.objections),
  slackSummary: z.string().describe(SCHEMA_DESCRIPTIONS.slackSummary),
  slackDetails: z.string().describe(SCHEMA_DESCRIPTIONS.slackDetails),
});

export type AgentOutput = z.infer<typeof agentOutputSchema>;
