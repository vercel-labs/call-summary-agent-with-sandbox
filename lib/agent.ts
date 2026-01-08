/**
 * AI agent that analyzes sales call transcripts using a sandbox environment.
 *
 * ARCHITECTURE NOTE:
 * This implementation uses ToolLoopAgent from the AI SDK, with the entire agent
 * run wrapped in a single workflow step (see stepRunAgent in workflows/gong-summary/steps.ts).
 *
 * For production systems processing thousands of calls, consider using the DurableAgent
 * pattern from the Workflow SDK, which makes each LLM call and tool execution a durable
 * checkpoint. Learn more: https://useworkflow.dev/docs/ai
 */

import { Output, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { Sandbox } from '@vercel/sandbox';
import ms from 'ms';
import { config, agentOutputSchema } from './config';
import { createAgentTools } from './tools';
import { generateFilesForSandbox, generateFileTree } from './sandbox-context';
import type { GongWebhookData } from './types';

/** Log entry structure for workflow streaming */
export type StreamLogEntry = {
  time: string;
  context: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
};

/** Log function type for emitting progress */
export type LogFn = (
  level: 'info' | 'warn' | 'error',
  context: string,
  message: string,
  data?: Record<string, unknown>
) => void;


const callOptionsSchema = z.object({
  webhookData: z.custom<GongWebhookData>(),
  log: z.custom<LogFn>(),
});

/** Create a ToolLoopAgent with sandbox and progress logging */
function createGongSummaryAgent(log: LogFn) {
  return new ToolLoopAgent({
    model: config.model,
    callOptionsSchema,
    onStepFinish: async (stepResult) => {
      const toolCalls = stepResult.toolCalls?.length || 0;
      if (stepResult.finishReason === 'stop') {
        log('info', 'agent', 'Generating structured output...');
      } else if (toolCalls > 0) {
        log('info', 'agent', 'Planning next action...');
      }
    },

    prepareCall: async ({ options, ...settings }) => {
      const { log } = options;

      log('info', 'agent', 'Creating sandbox...');
      const sandbox = await Sandbox.create({
        timeout: ms(config.sandbox.timeout),
      });
      log('info', 'agent', 'Sandbox created');

      log('info', 'agent', 'Generating context files...');
      const files = await generateFilesForSandbox({
        webhookData: options.webhookData,
      });

      const fileNames = Object.keys(files).sort();
      const fileList = fileNames.map((f) => `  → ${f}`).join('\n');
      log('info', 'agent', `Files ready (${fileNames.length} files):\n${fileList}`);

      const fileTree = generateFileTree(files);
      log('info', 'agent', 'Building agent context and instructions');

      const callMeta = options.webhookData.callData.metaData;
      const parties = options.webhookData.callData.parties || [];

      log('info', 'agent', `Call: ${callMeta.title || 'Untitled'}`);
      log('info', 'agent', `Participants: ${parties.length}`);

      const instructions = buildInstructions(callMeta, parties, fileTree);

      log('info', 'agent', 'Initializing bash tools...');
      const tools = await createAgentTools(sandbox, files, log);

      log('info', 'agent', 'Agent ready');

      return {
        ...settings,
        instructions,
        tools,
        output: Output.object({
          schema: agentOutputSchema,
        }),
      };
    },
  });
}

/**
 * Run the agent on a call transcript.
 * Requires a WritableStream for real-time log streaming.
 */
export async function runGongAgent(
  webhookData: GongWebhookData,
  logStream: WritableStream<StreamLogEntry>
): Promise<z.infer<typeof agentOutputSchema>> {
  const writer = logStream.getWriter();

  const log: LogFn = (level, context, message, data) => {
    writer.write({ time: new Date().toISOString(), level, context, message, data });
  };

  try {
    log('info', 'agent', 'Starting AI agent');

    const agent = createGongSummaryAgent(log);

    log('info', 'agent', 'Calling AI model...');
    const result = await agent.generate({
      prompt: TASK_PROMPT,
      options: {
        webhookData,
        log,
      },
    });
    log('info', 'agent', 'Analysis complete');
    return result.output as z.infer<typeof agentOutputSchema>;
  } catch (error) {
    log('error', 'agent', `Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  } finally {
    writer.releaseLock();
  }
}

// =============================================================================
// PROMPTS
// =============================================================================

/** Task prompt sent to the agent */
const TASK_PROMPT = `Analyze this call transcript and provide a comprehensive summary.

Focus on: Key discussion points and decisions, Any objections or concerns raised, Action items and next steps, Overall call assessment

Use the bash tool to explore the transcript files before generating your summary.`;

/** System prompt for the sales call analyst agent */
const SYSTEM_PROMPT = `You are an expert sales call analyst that reviews call transcripts and provides actionable insights.

Your task: Review the call context and use the tools to gather additional information before writing the summary. Then write a summary and extract objections, tasks, and key insights.

You have access to multiple tools for exploring call context:
1. **bash** - Execute shell commands to search and explore call transcript files

## Filesystem structure will be provided in context

## Writing messages:
For writing summaries, use this structure:

Headline statement (1-2 sentences) to establish the context.
Then, provide a short section expanding on key discussion points:

*{POINT_NAME}*
- Goal: one sentence describing the objective
- Key Insight: one sentence outlining what was discussed
- Concerns/Risks: one sentence summarizing concerns or blockers

Finish with Next Steps calling out the action items and the owners.

## Objections and scoring:
When you identify an objection, score it on a scale of 0 to 100 based on how well it was handled:
- 0-50: Objection was not handled sufficiently
- 51-70: Objection was partially handled
- 71-90: Objection was well handled
- 91-100: Objection was perfectly handled`;

/** Build the full instructions with call context */
function buildInstructions(
  callMeta: { title?: string | null; scheduled?: string | null; started?: string | null; duration?: number | null; system?: string | null },
  parties: Array<{ name?: string | null; affiliation?: string | null; title?: string | null }>,
  fileTree: string
): string {
  return `${SYSTEM_PROMPT}

## Call Context

**Call:** ${callMeta.title || 'Untitled Call'}
**Date:** ${callMeta.scheduled || callMeta.started || 'Unknown'}
**Duration:** ${callMeta.duration ? Math.round(callMeta.duration / 60) + ' minutes' : 'Unknown'}
**System:** ${callMeta.system || 'Unknown'}

**Participants:**
${parties.map((p) => `- ${p.name || 'Unknown'} (${p.affiliation || 'Unknown'})${p.title ? ` - ${p.title}` : ''}`).join('\n')}

## Filesystem Structure
\`\`\`
${fileTree}
\`\`\`

## Instructions

1. First, explore the call transcript using the bash tool
2. Search for key topics, objections, and action items
3. Analyze how objections were handled
4. Generate a comprehensive summary

## Metadata
- Current date: ${new Date().toISOString()}
- Company: ${config.companyName}`;
}
