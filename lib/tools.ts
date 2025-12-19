/**
 * Sandbox Agent Tools
 *
 * These tools are exposed to the agent for exploring and analyzing
 * call transcripts within the sandbox environment.
 *
 * Available tools:
 * - executeCommand: Run shell commands (grep, cat, ls, find, etc.)
 *
 * The tools are designed to be prescriptive and reusable across
 * different agent implementations.
 */

import { z } from 'zod';
import type { Sandbox } from '@vercel/sandbox';

/**
 * Create the executeCommand tool with a sandbox instance
 *
 * This tool allows the agent to run shell commands within the sandbox
 * to search and explore call transcript files.
 */
export function createExecuteCommandTool(sandbox: Sandbox) {
  return {
    description: `Execute shell commands to search and explore call transcript files.

Available commands: grep, cat, ls, find, head, tail, wc, sort, uniq, awk, sed

Example commands:
- ls gong-calls/ - List all available call transcripts
- grep -r "pricing" gong-calls/ - Search for pricing discussions across all calls
- grep -i "competitor" gong-calls/*.md - Find competitor mentions
- cat gong-calls/metadata.json - View call metadata
- find . -name "*.md" -exec grep -l "objection" {} \\; - Find files mentioning objections
- head -50 gong-calls/call.md - View first 50 lines of a transcript`,
    parameters: z.object({
      command: z.string().describe('The shell command to execute'),
      args: z.array(z.string()).describe('Arguments to pass to the command'),
    }),
    execute: async ({ command, args }: { command: string; args: string[] }) => {
      console.log('Executing command:', { command, args });

      try {
        const result = await sandbox.runCommand(command, args);
        const stdout = await result.stdout();
        const stderr = await result.stderr();

        return {
          stdout: stdout || '(no output)',
          stderr: stderr || '',
          exitCode: result.exitCode,
        };
      } catch (error) {
        return {
          stdout: '',
          stderr: error instanceof Error ? error.message : 'Unknown error',
          exitCode: 1,
        };
      }
    },
  };
}

/**
 * Create a web search tool (optional)
 *
 * This is a placeholder for web search functionality.
 * You can integrate with Exa, Tavily, or other search providers.
 */
export function createWebSearchTool() {
  return {
    description: `Search the web for additional context about topics discussed in the call.
Use this to find product documentation, competitor information, or industry context.`,
    parameters: z.object({
      query: z.string().describe('The search query'),
    }),
    execute: async ({ query }: { query: string }) => {
      // Placeholder - integrate with your preferred search provider
      // Examples: Exa (exalabs/ai-sdk), Tavily, Serper, etc.
      console.log('Web search requested:', query);

      return {
        results: [],
        message:
          'Web search not configured. Set up a search provider (Exa, Tavily, etc.) to enable this feature.',
      };
    },
  };
}

/**
 * Create all tools for the agent
 */
export function createAgentTools(sandbox: Sandbox) {
  return {
    executeCommand: createExecuteCommandTool(sandbox),
    // Uncomment to enable web search:
    // webSearch: createWebSearchTool(),
  };
}
