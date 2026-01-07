/**
 * Workflow Steps for Sales Call Summary
 *
 * Each step is marked with "use step" for durability and automatic retries.
 * Steps are the building blocks of workflows and should be idempotent.
 */

import type { GongWebhook, GongWebhookData } from '@/lib/types';
import type { AgentOutput } from '@/lib/config';
import { config } from '@/lib/config';
import {
  fetchGongTranscript,
  convertTranscriptToMarkdown,
} from '@/lib/gong-client';
import { getMockTranscript, getMockWebhookData } from '@/lib/mock-data';
import { runGongAgent } from '@/lib/agent';
import { sendSlackSummary, isSlackEnabled } from '@/lib/slack';
import { getWritable } from 'workflow';

export type StreamLogEntry = {
  time: string;
  context: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
};

async function emitLog(
  level: StreamLogEntry['level'],
  context: string,
  message: string,
  data?: Record<string, unknown>
) {
  const writable = getWritable<StreamLogEntry>({ namespace: 'logs' });
  const writer = writable.getWriter();
  await writer.write({
    time: new Date().toISOString(),
    context,
    level,
    message,
    data,
  });
  writer.releaseLock();
}

/**
 * Step: Fetch and convert Gong transcript to markdown
 */
export async function stepGetGongTranscript(
  webhookData: GongWebhook
): Promise<string | null> {
  'use step';

  try {
    const callId = webhookData.callData.metaData.id;
    await emitLog('info', 'transcript', 'Fetching transcript', { callId });

    let apiResponse;
    let webhookForMarkdown: GongWebhook;

    if (config.demo.enabled) {
      await emitLog('info', 'transcript', 'Using mock transcript (demo mode)');
      apiResponse = getMockTranscript();
      webhookForMarkdown = { ...getMockWebhookData(), isTest: true, isPrivate: false };
    } else {
      apiResponse = await fetchGongTranscript(callId);
      webhookForMarkdown = webhookData;
    }

    const markdown = convertTranscriptToMarkdown(apiResponse, webhookForMarkdown);
    await emitLog('info', 'transcript', 'Transcript ready', { length: markdown.length });

    return markdown;
  } catch (error) {
    await emitLog('error', 'transcript', 'Failed to fetch transcript', { error: String(error) });
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

  const result = await runGongAgent(options.webhookData, options.sfdcAccountId, emitLog);

  await emitLog('info', 'agent', 'Agent completed', {
    tasks: result.tasks.length,
    objections: result.objections.length,
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
    await emitLog('info', 'slack', 'Slack not configured, skipping');
    return;
  }

  await emitLog('info', 'slack', 'Sending to Slack');
  const result = await sendSlackSummary(output, recordingUrl);

  if (result.success) {
    await emitLog('info', 'slack', 'Sent to Slack');
  } else {
    await emitLog('warn', 'slack', 'Failed to send to Slack', { error: result.error });
  }
}

