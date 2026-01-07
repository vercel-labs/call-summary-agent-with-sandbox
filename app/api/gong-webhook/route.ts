/**
 * Gong Webhook API Route
 */

import { start } from 'workflow/api';
import type { GongWebhook } from '@/lib/types';
import { workflowGongSummary } from '@/workflows/gong-summary';
import { createLogger } from '@/lib/logger';
import { validateConfig, config } from '@/lib/config';
import { getMockWebhookData } from '@/lib/mock-data';
import type { StreamLogEntry } from '@/workflows/gong-summary/steps';

const logger = createLogger('gong-webhook');

export async function POST(request: Request) {
  const acceptHeader = request.headers.get('Accept') || '';
  const wantsStream = acceptHeader.includes('text/event-stream');

  const configValidation = validateConfig();
  if (!configValidation.valid) {
    logger.error('Configuration invalid', { errors: configValidation.errors });
    return Response.json(
      { error: 'Configuration error', details: configValidation.errors },
      { status: 500 }
    );
  }

  // For streaming, use workflow's built-in streaming
  if (wantsStream) {
    const userAgent = request.headers.get('User-Agent') || '';
    const isCurl = userAgent.toLowerCase().includes('curl');
    return await streamWorkflow(config.demo.enabled ? null : request, isCurl);
  }

  try {
    let data: GongWebhook;
    if (config.demo.enabled) {
      const mockData = getMockWebhookData();
      data = { ...mockData, isTest: true, isPrivate: false };
      logger.info('Demo mode: using mock webhook data');
    } else {
      data = (await request.json()) as GongWebhook;
    }

    logger.info('Webhook received', {
      callId: data.callData.metaData.id,
      callTitle: data.callData.metaData.title,
      callUrl: data.callData.metaData.url,
      scheduled: data.callData.metaData.scheduled,
      duration: data.callData.metaData.duration,
      isTest: data.isTest,
    });

    await start(workflowGongSummary, [data]);
    logger.info('Workflow triggered', { callId: data.callData.metaData.id });

    return Response.json({
      message: 'Workflow triggered',
      callId: data.callData.metaData.id,
    });
  } catch (error) {
    logger.error('Failed to process webhook', error);
    return Response.json(
      { error: 'Failed to process webhook', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function streamWorkflow(request: Request | null, isCurl: boolean): Promise<Response> {
  const encoder = new TextEncoder();

  try {
    // Prepare webhook data
    let data: GongWebhook;
    if (config.demo.enabled) {
      const mockData = getMockWebhookData();
      data = { ...mockData, isTest: true, isPrivate: false };
      logger.info('Demo mode: using mock webhook data');
    } else {
      data = (await request!.json()) as GongWebhook;
    }

    logger.info('Webhook received', {
      callId: data.callData.metaData.id,
      callTitle: data.callData.metaData.title,
    });

    // Start workflow and get the readable stream
    const run = await start(workflowGongSummary, [data]);
    const logsReadable = run.getReadable<StreamLogEntry>({ namespace: 'logs' });

    // Transform the workflow stream to SSE format
    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = logsReadable.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode(`data: "[DONE]"\n\n`));
              controller.close();
              break;
            }

            // Format output based on client type
            let output: string;
            if (isCurl && value) {
              const time = new Date(value.time).toLocaleTimeString('en-US', { hour12: false });
              const logData = value.data ? ` ${JSON.stringify(value.data)}` : '';
              output = `[${time}] [${value.context}] ${value.message}${logData}`;
            } else {
              output = JSON.stringify(value);
            }
            controller.enqueue(encoder.encode(`data: ${output}\n\n`));
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : 'Stream error' })}\n\n`));
          controller.close();
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    logger.error('Failed to start workflow stream', err);
    return Response.json(
      { error: 'Failed to start workflow', message: err instanceof Error ? err.message : 'Unknown error' },
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
    service: 'sales-call-summary-agent',
    demoMode: config.demo.enabled,
    configValid: configValidation.valid,
    configErrors: configValidation.errors,
  });
}

