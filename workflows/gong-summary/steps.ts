/**
 * Workflow Steps for Gong Call Summary
 *
 * Each step is marked with "use step" for durability and automatic retries.
 * Steps are the building blocks of workflows and should be idempotent.
 */

import type { GongWebhook, GongWebhookData } from '@/lib/types';
import type { AgentOutput } from '@/lib/config';
import {
  fetchGongTranscript,
  convertTranscriptToMarkdown,
} from '@/lib/gong-client';
import { runGongAgent } from '@/lib/agent';
import { sendSlackSummary, isSlackEnabled } from '@/lib/slack';
import { createLogger } from '@/lib/logger';

const logger = createLogger('gong-steps');

/**
 * Step: Fetch and convert Gong transcript to markdown
 */
export async function stepGetGongTranscript(
  webhookData: GongWebhook
): Promise<string | null> {
  'use step';

  try {
    const callId = webhookData.callData.metaData.id;
    logger.info('Fetching transcript', { callId });

    const apiResponse = await fetchGongTranscript(callId);
    const markdown = convertTranscriptToMarkdown(apiResponse, webhookData);

    logger.info('Transcript fetched', {
      callId,
      length: markdown.length,
    });

    return markdown;
  } catch (error) {
    logger.error('Failed to fetch transcript', error);
    return null;
  }
}

/**
 * Step: Run the AI agent to generate call summary
 */
export async function stepRunAgent(options: {
  webhookData: GongWebhookData;
  sfdcAccountId?: string;
}): Promise<AgentOutput> {
  'use step';

  logger.info('Running agent', {
    callId: options.webhookData.callData.metaData.id,
    hasSfdcAccountId: !!options.sfdcAccountId,
  });

  const result = await runGongAgent(
    options.webhookData,
    options.sfdcAccountId
  );

  logger.info('Agent completed', {
    tasksCount: result.tasks.length,
    objectionsCount: result.objections.length,
  });

  return result;
}

/**
 * Step: Send summary to Slack (optional)
 *
 * This step sends the summary to the configured Slack channel.
 * Configure via SLACK_BOT_TOKEN and SLACK_CHANNEL_ID env vars.
 *
 * To extend for multiple channels:
 * - Add additional channel configuration
 * - Route based on call properties (e.g., account, team)
 */
export async function stepSendSlackSummary(
  output: AgentOutput,
  recordingUrl?: string
): Promise<void> {
  'use step';

  if (!isSlackEnabled()) {
    logger.info('Slack not enabled, skipping notification');
    return;
  }

  logger.info('Sending Slack summary');

  const result = await sendSlackSummary(output, recordingUrl);

  if (result.success) {
    logger.info('Slack summary sent successfully');
  } else {
    logger.warn('Failed to send Slack summary', { error: result.error });
  }
}

