/**
 * Sales Call Summary Workflow
 *
 * This workflow processes Gong call webhooks and generates AI-powered summaries.
 * It uses the Vercel Workflow DevKit with the "use workflow" directive for
 * durability, automatic retries, and observability.
 *
 * Flow:
 * 1. Receive Gong webhook
 * 2. Fetch transcript from Gong API
 * 3. Run AI agent to generate summary
 * 4. (Optional) Send to Slack
 */

import type { GongWebhook } from '@/lib/types';
import { createLogger } from '@/lib/logger';
import {
  stepGetGongTranscript,
  stepRunAgent,
  stepSendSlackSummary,
  stepEmitResult,
  stepWorkflowStarted,
  stepWorkflowComplete,
} from './steps';

/**
 * Main workflow for processing Gong call summaries
 *
 * The "use workflow" directive makes this a durable workflow that:
 * - Automatically retries failed steps
 * - Maintains state across function invocations
 * - Provides observability through the Vercel dashboard
 */
export async function workflowGongSummary(data: GongWebhook) {
  'use workflow';

  const logger = createLogger('gong-summary');
  const callId = data.callData.metaData.id;
  const callTitle = data.callData.metaData.title || 'Untitled';

  logger.info('Workflow started', { callId, callTitle });
  await stepWorkflowStarted(callTitle);

  // Step 1: Fetch transcript from Gong API
  const markdown = await stepGetGongTranscript(data);
  if (!markdown) {
    logger.warn('No transcript available');
    return { success: false, reason: 'No transcript available' };
  }

  // Step 2: Run the AI agent to generate summary
  // To add Salesforce CRM context, extract sfdcAccountId from data.callData.context and pass it: stepRunAgent({ webhookData: data, sfdcAccountId })
  const agentOutput = await stepRunAgent({ webhookData: data });

  // Step 3: Emit the result to stream
  await stepEmitResult(agentOutput);

  // Step 4: Send to Slack (optional)
  await stepSendSlackSummary(agentOutput, data.callData.metaData.url);

  logger.info('Workflow completed', { tasksCount: agentOutput.tasks.length });
  await stepWorkflowComplete();

  return {
    success: true,
    summary: agentOutput.summary,
    tasksCount: agentOutput.tasks.length,
    objectionsCount: agentOutput.objections.length,
  };
}

