/**
 * Gong Webhook API Route
 */

import { start } from 'workflow/api';
import type { GongWebhook } from '@/lib/types';
import { workflowGongSummary } from '@/workflows/gong-summary';
import { createLogger } from '@/lib/logger';
import { validateConfig, config } from '@/lib/config';
import { getMockWebhookData } from '@/lib/mock-data';
import { logStream } from '@/lib/log-stream';

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

  // For streaming, we need to set up subscriber before logging
  if (wantsStream) {
    const userAgent = request.headers.get('User-Agent') || '';
    const isCurl = userAgent.toLowerCase().includes('curl');
    return streamWorkflow(config.demo.enabled ? null : request, isCurl);
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

function streamWorkflow(request: Request | null, isCurl: boolean): Response {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        if (!closed) {
          let output: string;
          if (isCurl && obj && typeof obj === 'object' && 'message' in obj) {
            const log = obj as { time: string; context: string; level: string; message: string; data?: unknown };
            const time = new Date(log.time).toLocaleTimeString('en-US', { hour12: false });
            const data = log.data ? ` ${JSON.stringify(log.data)}` : '';
            output = `[${time}] [${log.context}] ${log.message}${data}`;
          } else {
            output = JSON.stringify(obj);
          }
          controller.enqueue(encoder.encode(`data: ${output}\n\n`));
        }
      };

      const closeStream = () => {
        if (closed) return;
        closed = true;
        unsubscribe?.();
        if (timeoutId) clearTimeout(timeoutId);
        controller.enqueue(encoder.encode(`data: "[DONE]"\n\n`));
        controller.close();
      };

      // Set up subscriber FIRST, before any logging
      unsubscribe = logStream.subscribe((log) => {
        send(log);
        // Close on workflow completion, agent completion, or errors
        if (
          log.message.includes('Workflow completed') ||
          log.message.includes('Agent completed') ||
          log.message.includes('failed after max retries') ||
          log.message.includes('Agent error')
        ) {
          closeStream();
        }
      });

      // Timeout after 2 minutes
      timeoutId = setTimeout(() => {
        logger.info('Stream timeout reached');
        closeStream();
      }, 120000);

      try {
        // Now parse data and log (subscriber is already listening)
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
          callUrl: data.callData.metaData.url,
          scheduled: data.callData.metaData.scheduled,
          duration: data.callData.metaData.duration,
          isTest: data.isTest,
        });

        await start(workflowGongSummary, [data]);
        logger.info('Workflow triggered', { callId: data.callData.metaData.id });
      } catch (err) {
        send({ error: err instanceof Error ? err.message : 'Unknown error' });
        closeStream();
      }
    },
    cancel() {
      closed = true;
      unsubscribe?.();
      if (timeoutId) clearTimeout(timeoutId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
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

