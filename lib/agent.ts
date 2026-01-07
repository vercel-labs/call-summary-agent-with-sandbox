/**
 * Sales Call Summary Agent
 */

import { Output, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { Sandbox } from '@vercel/sandbox';
import ms from 'ms';
import { config, agentOutputSchema } from './config';
import { createAgentTools } from './tools';
import { generateFilesForSandbox, generateFileTree } from './sandbox-context';
import type { GongWebhookData } from './types';

/**
 * Input options for the agent
 */
const callOptionsSchema = z.object({
  webhookData: z.custom<GongWebhookData>(),
  sfdcAccountId: z.string().optional(),
});

/**
 * The Sales Call Summary Agent
 *
 * Uses ToolLoopAgent from the Vercel AI SDK to:
 * 1. Create a sandbox environment with call context
 * 2. Provide tools for exploring transcripts
 * 3. Generate structured summaries
 */
export const gongSummaryAgent = new ToolLoopAgent({
  model: config.model,

  callOptionsSchema,

  prepareCall: async ({ options, ...settings }) => {
    console.log('[DEBUG] prepareCall started');

    // Create sandbox environment
    console.log('[DEBUG] Creating sandbox...');
    const sandbox = await Sandbox.create({
      timeout: ms(config.sandbox.timeout),
    });
    console.log('[DEBUG] Sandbox created');

    // Generate context files for the sandbox
    console.log('[DEBUG] Generating files for sandbox...');
    const files = await generateFilesForSandbox({
      webhookData: options.webhookData,
      sfdcAccountId: options.sfdcAccountId,
    });
    console.log('[DEBUG] Files generated:', Object.keys(files).length, 'files');

    // Generate file tree for the prompt
    const fileTree = generateFileTree(files);

    // Get call metadata for context
    const callMeta = options.webhookData.callData.metaData;
    const parties = options.webhookData.callData.parties || [];

    // Build the system instructions
    const instructions = `${config.systemPrompt}

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

    // Create tools with sandbox instance and files
    // Files are written to /workspace by default
    console.log('[DEBUG] Creating agent tools...');
    const tools = await createAgentTools(sandbox, files);
    console.log('[DEBUG] Agent tools created');

    console.log('[DEBUG] prepareCall complete, returning settings');
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

/**
 * Run the agent on a call transcript
 */
export async function runGongAgent(
  webhookData: GongWebhookData,
  sfdcAccountId?: string
): Promise<z.infer<typeof agentOutputSchema>> {
  console.log('[DEBUG] runGongAgent called');
  console.log('[DEBUG] Model:', config.model);
  console.log('[DEBUG] webhookData callId:', webhookData.callData.metaData.id);

  try {
    console.log('[DEBUG] Starting gongSummaryAgent.generate()');
    const result = await gongSummaryAgent.generate({
      prompt: `Analyze this call transcript and provide a comprehensive summary.

Focus on: Key discussion points and decisions, Any objections or concerns raised, Action items and next steps, Overall call assessment

Use the bash tool to explore the transcript files before generating your summary.`,
      options: {
        webhookData,
        sfdcAccountId,
      },
    });

    console.log('[DEBUG] Agent completed successfully');
    return result.output as z.infer<typeof agentOutputSchema>;
  } catch (error) {
    console.error('[DEBUG] Agent error:', error);
    console.error('[DEBUG] Error name:', (error as Error).name);
    console.error('[DEBUG] Error message:', (error as Error).message);
    console.error('[DEBUG] Error stack:', (error as Error).stack);
    if (error && typeof error === 'object' && 'cause' in error) {
      console.error('[DEBUG] Error cause:', (error as any).cause);
    }
    throw error;
  }
}
