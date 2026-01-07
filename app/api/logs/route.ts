import { logStream } from '@/lib/log-stream';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send existing buffer
      for (const log of logStream.getBuffer()) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`));
      }

      // Subscribe to new logs
      const unsubscribe = logStream.subscribe((log) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`));
      });

      // Cleanup on close
      const cleanup = () => unsubscribe();
      return cleanup;
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
