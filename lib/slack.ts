/**
 * Slack Integration (Optional)
 *
 * This module provides optional Slack notifications for call summaries.
 * Enable by setting SLACK_BOT_TOKEN and SLACK_CHANNEL_ID environment variables.
 *
 * Configuration:
 * - SLACK_BOT_TOKEN: Your Slack bot token (xoxb-...)
 * - SLACK_CHANNEL_ID: Single channel ID for posting summaries
 *
 * To extend for multiple channels, modify sendSlackSummary() to accept
 * additional channel IDs or route based on call properties.
 */

import { WebClient } from '@slack/web-api';
import { config } from './config';

// Initialize Slack client if configured
let slackClient: WebClient | null = null;

function getSlackClient(): WebClient {
  if (!slackClient) {
    if (!config.slack.botToken) {
      throw new Error('SLACK_BOT_TOKEN is required for Slack integration');
    }
    slackClient = new WebClient(config.slack.botToken);
  }
  return slackClient;
}

/**
 * Check if Slack integration is enabled
 */
export function isSlackEnabled(): boolean {
  return config.slack.enabled && !!config.slack.channelId;
}

/**
 * Send a message to a Slack channel
 */
async function sendSlackMessage(
  channelId: string,
  message: string,
  options?: {
    threadTs?: string;
    tagUsers?: string[];
  }
): Promise<{ success: boolean; threadTs?: string; error?: string }> {
  try {
    const client = getSlackClient();
    let finalMessage = message;

    // Add user mentions if provided
    if (options?.tagUsers && options.tagUsers.length > 0) {
      const mentions = options.tagUsers
        .map((userId) => `<@${userId}>`)
        .join(' ');
      finalMessage = `${mentions} ${message}`;
    }

    const result = await client.chat.postMessage({
      channel: channelId,
      text: finalMessage,
      ...(options?.threadTs && { thread_ts: options.threadTs }),
    });

    return {
      success: result.ok ?? false,
      threadTs: result.ts,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send call summary to configured Slack channel
 */
export async function sendSlackSummary(
  summary: string,
  recordingUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSlackEnabled()) {
    console.log('Slack integration not enabled, skipping notification');
    return { success: true };
  }

  const channelId = config.slack.channelId;

  // Send summary with optional recording URL
  const message = recordingUrl
    ? `${summary}\n\n*Recording:* ${recordingUrl}`
    : summary;

  return sendSlackMessage(channelId, message);
}
