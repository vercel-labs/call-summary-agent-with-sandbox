/**
 * Workflow Steps for Sales Call Summary
 *
 * Each step is marked with "use step" for durability and automatic retries.
 */

import type { GongWebhook, GongWebhookData } from '@/lib/types';
import type { AgentOutput } from '@/lib/config';
import { isDemoMode } from '@/lib/config';
import { fetchGongTranscript, convertTranscriptToMarkdown } from '@/lib/gong-client';
import { getMockTranscript, getMockWebhookData } from '@/lib/mock-data';
import { runGongAgent, type StreamLogEntry } from '@/lib/agent';
import { sendSlackSummary, isSlackEnabled } from '@/lib/slack';
import { getWritable } from 'workflow';

// Re-export for route.ts
export type { StreamLogEntry };

/** Helper to write a single log entry */
async function writeLog(
  writer: WritableStreamDefaultWriter<StreamLogEntry>,
  level: StreamLogEntry['level'],
  context: string,
  message: string,
  data?: Record<string, unknown>
) {
  await writer.write({ time: new Date().toISOString(), level, context, message, data });
}

/**
 * Step: Fetch and convert Gong transcript to markdown
 */
export async function stepGetGongTranscript(webhookData: GongWebhook): Promise<string | null> {
  'use step';

  const writer = getWritable<StreamLogEntry>({ namespace: 'logs' }).getWriter();

  try {
    const callId = webhookData.callData.metaData.id;
    await writeLog(writer, 'info', 'transcript', 'Fetching transcript', { callId });

    let apiResponse;
    let webhookForMarkdown: GongWebhook;

    if (isDemoMode()) {
      await writeLog(writer, 'info', 'transcript', 'Using mock transcript (demo mode)');
      apiResponse = getMockTranscript();
      webhookForMarkdown = { ...getMockWebhookData(), isTest: true, isPrivate: false };
    } else {
      apiResponse = await fetchGongTranscript(callId);
      webhookForMarkdown = webhookData;
    }

    const markdown = convertTranscriptToMarkdown(apiResponse, webhookForMarkdown);
    await writeLog(writer, 'info', 'transcript', 'Transcript ready', { length: markdown.length });

    return markdown;
  } catch (error) {
    await writeLog(writer, 'error', 'transcript', 'Failed to fetch transcript', { error: String(error) });
    return null;
  } finally {
    writer.releaseLock();
  }
}

/**
 * Step: Run the AI agent to generate call summary
 * To add Salesforce CRM context, add sfdcAccountId to options and pass to runGongAgent.
 */
export async function stepRunAgent(options: {
  webhookData: GongWebhookData;
}): Promise<AgentOutput> {
  'use step';

  const logStream = getWritable<StreamLogEntry>({ namespace: 'logs' });
  return runGongAgent(options.webhookData, logStream);
}

/**
 * Step: Send summary to Slack (optional)
 */
export async function stepSendSlackSummary(output: AgentOutput, recordingUrl?: string): Promise<void> {
  'use step';

  const writer = getWritable<StreamLogEntry>({ namespace: 'logs' }).getWriter();

  try {
    if (!isSlackEnabled()) {
      await writeLog(writer, 'info', 'slack', 'Slack not configured, skipping');
      return;
    }

    await writeLog(writer, 'info', 'slack', 'Sending to Slack');
    const result = await sendSlackSummary(output, recordingUrl);

    if (result.success) {
      await writeLog(writer, 'info', 'slack', 'Sent to Slack');
    } else {
      await writeLog(writer, 'warn', 'slack', 'Failed to send to Slack', { error: result.error });
    }
  } finally {
    writer.releaseLock();
  }
}

/**
 * Step: Emit workflow started log
 */
export async function stepWorkflowStarted(callTitle: string): Promise<void> {
  'use step';

  const writer = getWritable<StreamLogEntry>({ namespace: 'logs' }).getWriter();
  try {
    await writeLog(writer, 'info', 'workflow', `Workflow started: ${callTitle}`);
  } finally {
    writer.releaseLock();
  }
}

/**
 * Step: Emit workflow complete log
 */
export async function stepWorkflowComplete(): Promise<void> {
  'use step';

  const writer = getWritable<StreamLogEntry>({ namespace: 'logs' }).getWriter();
  try {
    await writeLog(writer, 'info', 'workflow', 'Workflow complete');
  } finally {
    writer.releaseLock();
  }
}

/**
 * Step: Emit the final summary result
 */
export async function stepEmitResult(output: AgentOutput): Promise<void> {
  'use step';

  const writer = getWritable<StreamLogEntry>({ namespace: 'logs' }).getWriter();

  try {
    await writeLog(writer, 'info', 'result', '--- Generated Summary ---');
    await writeLog(writer, 'info', 'result', output.summary);

    if (output.tasks.length > 0) {
      await writeLog(writer, 'info', 'result', `Tasks (${output.tasks.length}):`);
      for (const task of output.tasks) {
        await writeLog(writer, 'info', 'result', `  • ${task.taskDescription} [${task.taskOwner}]`);
      }
    }

    if (output.objections.length > 0) {
      await writeLog(writer, 'info', 'result', `Objections (${output.objections.length}):`);
      for (const obj of output.objections) {
        await writeLog(writer, 'info', 'result', `  • ${obj.description} (${obj.speaker})`);
      }
    }

    await writeLog(writer, 'info', 'result', 'Summary complete');
  } finally {
    writer.releaseLock();
  }
}
