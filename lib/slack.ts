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
import type { AgentOutput } from './config';

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
export async function sendSlackMessage(
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
 * Format agent output for Slack message
 */
export function formatSlackMessage(output: AgentOutput): string {
  let message = output.slackSummary;

  // Add objection summary if there are any
  const unhandledCount = output.objections.filter((o) => !o.handled).length;
  const handledCount = output.objections.filter((o) => o.handled).length;

  if (output.objections.length > 0) {
    message += `\n\n*Objections:* ${handledCount} handled, ${unhandledCount} need follow-up`;
  }

  // Add task count
  if (output.tasks.length > 0) {
    message += `\n*Action Items:* ${output.tasks.length} tasks identified`;
  }

  return message;
}

/**
 * Format detailed objections for Slack thread reply
 */
export function formatObjectionsMessage(output: AgentOutput): string {
  if (output.objections.length === 0) {
    return '';
  }

  const formatObjection = (objection: AgentOutput['objections'][number]) => {
    const status = objection.handled
      ? objection.handledScore >= 70
        ? '[Well Handled]'
        : '[Partially Handled]'
      : '[Needs Follow Up]';
    return `${status} *${objection.description}*\n> "${objection.quote}"\n> _- ${objection.speaker} (${objection.speakerCompany})_${objection.handled ? `\n_Handled by ${objection.handledBy}: ${objection.handledAnswer}_` : ''}`;
  };

  const unhandled = output.objections.filter((o) => !o.handled);
  const wellHandled = output.objections.filter(
    (o) => o.handled && o.handledScore >= 70
  );
  const partiallyHandled = output.objections.filter(
    (o) => o.handled && o.handledScore < 70
  );

  let message = '';

  if (wellHandled.length > 0) {
    message += `*Well Handled:*\n${wellHandled.map(formatObjection).join('\n\n')}\n\n`;
  }

  if (partiallyHandled.length > 0) {
    message += `*Partially Handled:*\n${partiallyHandled.map(formatObjection).join('\n\n')}\n\n`;
  }

  if (unhandled.length > 0) {
    message += `*Needs Follow Up:*\n${unhandled.map(formatObjection).join('\n\n')}`;
  }

  return message.trim();
}

/**
 * Send call summary to configured Slack channel
 *
 * Sends the summary as a main message and details as a thread reply.
 * Configure via SLACK_CHANNEL_ID env var.
 *
 * To extend for multiple channels:
 * - Add additional channel IDs to config
 * - Modify this function to route based on call properties
 */
export async function sendSlackSummary(
  output: AgentOutput,
  recordingUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSlackEnabled()) {
    console.log('Slack integration not enabled, skipping notification');
    return { success: true };
  }

  const channelId = config.slack.channelId;

  // Send main summary
  const mainMessage = formatSlackMessage(output);
  const mainResult = await sendSlackMessage(channelId, mainMessage);

  if (!mainResult.success) {
    return { success: false, error: mainResult.error };
  }

  // Send details in thread
  if (mainResult.threadTs) {
    // Send detailed reply
    const detailsMessage =
      output.slackDetails +
      (recordingUrl ? `\n\n*Recording:* ${recordingUrl}` : '');
    await sendSlackMessage(channelId, detailsMessage, {
      threadTs: mainResult.threadTs,
    });

    // Send objections if any
    const objectionsMessage = formatObjectionsMessage(output);
    if (objectionsMessage) {
      await sendSlackMessage(channelId, objectionsMessage, {
        threadTs: mainResult.threadTs,
      });
    }

    // Send tasks if any
    if (output.tasks.length > 0) {
      const tasksMessage =
        '*Action Items:*\n' +
        output.tasks
          .map(
            (t, i) =>
              `${i + 1}. ${t.taskDescription} _(${t.taskOwner} - ${t.ownerCompany})_`
          )
          .join('\n');
      await sendSlackMessage(channelId, tasksMessage, {
        threadTs: mainResult.threadTs,
      });
    }
  }

  return { success: true };
}

/**
 * Get Slack user ID by email
 */
export async function getSlackUserIdByEmail(
  email: string
): Promise<string | null> {
  try {
    const client = getSlackClient();
    const result = await client.users.lookupByEmail({ email });
    return result.user?.id || null;
  } catch (error) {
    console.warn(`Could not find Slack user for email: ${email}`);
    return null;
  }
}
