/**
 * Gong Webhook API Route
 *
 * This is the entry point for Gong webhooks. When a call is completed,
 * Gong sends a POST request to this endpoint with call data.
 */

import { start } from 'workflow/api';
import type { GongWebhook } from '@/lib/types';
import { workflowGongSummary } from '@/workflows/gong-summary';
import { createLogger } from '@/lib/logger';
import { validateConfig } from '@/lib/config';

const logger = createLogger('gong-webhook');

export async function POST(request: Request) {

  const configValidation = validateConfig();
  if (!configValidation.valid) {
    logger.error('Configuration invalid', { errors: configValidation.errors });
    return Response.json(
      {
        error: 'Configuration error',
        details: configValidation.errors,
      },
      { status: 500 }
    );
  }

  try {
    const data = (await request.json()) as GongWebhook;

    console.log('Data payload: ', data);
    logger.info('Webhook received', {
      callId: data.callData.metaData.id,
      callTitle: data.callData.metaData.title,
      callUrl: data.callData.metaData.url,
      scheduled: data.callData.metaData.scheduled,
      duration: data.callData.metaData.duration,
      isTest: data.isTest,
    });

    await start(workflowGongSummary, [data]);

    logger.info('Workflow triggered', {
      callId: data.callData.metaData.id,
    });

    return Response.json({
      message: 'Workflow triggered',
      callId: data.callData.metaData.id,
    });
  } catch (error) {
    logger.error('Failed to process webhook', error);
    return Response.json(
      {
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for health check
 */
export async function GET() {
  const configValidation = validateConfig();

  return Response.json({
    status: 'ok',
    service: 'gong-call-summary-agent',
    configValid: configValidation.valid,
    configErrors: configValidation.errors,
  });
}

