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
import { createLogger } from './logger';
import type { GongWebhookData } from './types';

const logger = createLogger('agent');

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
    logger.debug('prepareCall started');

    logger.debug('Creating sandbox...');
    const sandbox = await Sandbox.create({
      timeout: ms(config.sandbox.timeout),
    });
    logger.debug('Sandbox created');

    logger.debug('Generating files for sandbox...');
    const files = await generateFilesForSandbox({
      webhookData: options.webhookData,
      sfdcAccountId: options.sfdcAccountId,
    });
    logger.debug('Files generated', { count: Object.keys(files).length });

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

    logger.debug('Creating agent tools...');
    const tools = await createAgentTools(sandbox, files);
    logger.debug('Agent tools created');

    logger.debug('prepareCall complete');
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
  logger.debug('runGongAgent called', {
    model: config.model,
    callId: webhookData.callData.metaData.id,
  });

  try {
    logger.debug('Starting AI agent...');
    const result = await gongSummaryAgent.generate({
      prompt: `Analyze this call transcript and provide a comprehensive summary.

Focus on: Key discussion points and decisions, Any objections or concerns raised, Action items and next steps, Overall call assessment

Use the bash tool to explore the transcript files before generating your summary.`,
      options: {
        webhookData,
        sfdcAccountId,
      },
    });

    logger.debug('Agent completed successfully');
    return result.output as z.infer<typeof agentOutputSchema>;
  } catch (error) {
    logger.error('Agent error', error);
    throw error;
  }
}
