/**
 * Gong Webhook API Route
 *
 * Handles incoming Gong webhooks and triggers the call summary workflow.
 * Supports both regular responses and SSE streaming for real-time logs.
 */

import { start } from "workflow/api";
import type { GongWebhook } from "@/lib/types";
import { workflowGongSummary } from "@/workflows/gong-summary";
import { createLogger } from "@/lib/logger";
import { isDemoMode } from "@/lib/config";
import { getMockWebhookData } from "@/lib/mock-data";
import type { StreamLogEntry } from "@/lib/agent";

const logger = createLogger("gong-webhook");

/** Prepare webhook data - uses mock data in demo mode */
async function getWebhookData(request: Request | null): Promise<GongWebhook> {
  if (isDemoMode()) {
    logger.info("Demo mode: using mock webhook data");
    return { ...getMockWebhookData(), isTest: true, isPrivate: false };
  }
  return (await request!.json()) as GongWebhook;
}

export async function POST(request: Request) {
  logger.info("POST /api/gong-webhook called", {
    url: request.url,
    method: request.method,
  });

  const acceptHeader = request.headers.get("Accept") || "";
  const wantsStream = acceptHeader.includes("text/event-stream");

  logger.info("Request details", {
    acceptHeader,
    wantsStream,
    demoMode: isDemoMode(),
  });

  if (wantsStream) {
    const userAgent = request.headers.get("User-Agent") || "";
    const isCurl = userAgent.toLowerCase().includes("curl");
    logger.info("Streaming mode", { userAgent, isCurl });
    return await streamWorkflow(isDemoMode() ? null : request, isCurl);
  }

  try {
    logger.info("Non-streaming mode, getting webhook data...");
    const data = await getWebhookData(request);

    logger.info("Webhook received", {
      callId: data.callData.metaData.id,
      callTitle: data.callData.metaData.title,
      callUrl: data.callData.metaData.url,
      scheduled: data.callData.metaData.scheduled,
      duration: data.callData.metaData.duration,
      isTest: data.isTest,
    });

    logger.info("About to call start(workflowGongSummary)...");
    const run = await start(workflowGongSummary, [data]);
    logger.info("Workflow started", { callId: data.callData.metaData.id });

    return Response.json({
      message: "Workflow triggered",
      callId: data.callData.metaData.id,
    });
  } catch (error) {
    logger.error("Failed to process webhook", {
      error: String(error),
      stack: (error as Error)?.stack,
    });
    return Response.json(
      {
        error: "Failed to process webhook",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function streamWorkflow(
  request: Request | null,
  isCurl: boolean
): Promise<Response> {
  const encoder = new TextEncoder();
  logger.info("streamWorkflow called", { hasRequest: !!request, isCurl });

  try {
    logger.info("Getting webhook data for stream...");
    const data = await getWebhookData(request);
    logger.info("Got webhook data", { callId: data.callData.metaData.id });

    // Start workflow and get the readable stream
    logger.info("Starting workflow for streaming...");
    const run = await start(workflowGongSummary, [data]);
    logger.info("Workflow run created");
    const logsReadable = run.getReadable<StreamLogEntry>({ namespace: "logs" });

    // Transform the workflow stream to SSE format
    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = logsReadable.getReader();

        // Read logs in parallel with waiting for workflow completion
        const readLogs = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Format output based on client type
              let output: string;
              if (isCurl && value) {
                const time = new Date(value.time).toLocaleTimeString("en-US", {
                  hour12: false,
                });
                const logData = value.data
                  ? ` ${JSON.stringify(value.data)}`
                  : "";
                output = `[${time}] [${value.context}] ${value.message}${logData}`;
              } else {
                output = JSON.stringify(value);
              }
              controller.enqueue(encoder.encode(`data: ${output}\n\n`));
            }
          } finally {
            reader.releaseLock();
          }
        };

        try {
          // Wait for both: log streaming and workflow completion
          await Promise.all([
            readLogs(),
            run.returnValue, // Wait for workflow to complete
          ]);
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: err instanceof Error ? err.message : "Stream error",
              })}\n\n`
            )
          );
        } finally {
          controller.enqueue(encoder.encode(`data: "[DONE]"\n\n`));
          controller.close();
        }
      },
    });

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    logger.error("Failed to start workflow stream", err);
    return Response.json(
      {
        error: "Failed to start workflow",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
