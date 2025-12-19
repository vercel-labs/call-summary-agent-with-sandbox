/**
 * Gong Call Summary Workflow
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

  logger.info('Workflow started', {
    callId: data.callData.metaData.id,
    callTitle: data.callData.metaData.title,
    callUrl: data.callData.metaData.url,
    scheduled: data.callData.metaData.scheduled,
    duration: data.callData.metaData.duration,
  });

  // Extract CRM context if available (e.g., Salesforce Account ID)
  const sfdcAccountId = data.callData.context
    ?.find((context) => context.system === 'Salesforce')
    ?.objects?.find((object) => object.objectType === 'Account')?.objectId;

  logger.info('Extracted context', { sfdcAccountId });

  // Step 1: Fetch transcript from Gong API
  logger.info('Fetching transcript');
  const markdown = await stepGetGongTranscript(data);

  if (!markdown) {
    logger.warn('No transcript available, ending workflow');
    return { success: false, reason: 'No transcript available' };
  }

  // Step 2: Run the AI agent to generate summary
  logger.info('Running AI agent');
  const agentOutput = await stepRunAgent({
    webhookData: data,
    sfdcAccountId,
  });

  logger.info('Agent completed', {
    tasksCount: agentOutput.tasks.length,
    objectionsCount: agentOutput.objections.length,
  });

  // Step 3: Send to Slack (optional)
  const recordingUrl = data.callData.metaData.url;
  await stepSendSlackSummary(agentOutput, recordingUrl);

  logger.info('Workflow completed successfully');

  return {
    success: true,
    summary: agentOutput.summary,
    tasksCount: agentOutput.tasks.length,
    objectionsCount: agentOutput.objections.length,
  };
}

