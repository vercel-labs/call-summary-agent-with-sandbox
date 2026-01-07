/**
 * Sandbox Agent Tools
 *
 * Uses bash-tool for AI agent shell command execution within the sandbox.
 */

import { createBashTool } from 'bash-tool';
import type { Sandbox } from '@vercel/sandbox';
import { createLogger } from './logger';

const logger = createLogger('bash-tool');

/**
 * Create agent tools with bash-tool
 *
 * Provides a bash tool for the agent to run shell commands within the sandbox
 * to search and explore call transcript files.
 *
 * @param sandbox - The Vercel sandbox instance
 * @param files - Files to write to the sandbox (path -> content)
 */
export async function createAgentTools(
  sandbox: Sandbox,
  files: Record<string, string>
) {
  const { tools } = await createBashTool({
    sandbox,
    files,
    destination: '/vercel/sandbox',
    onBeforeBashCall: ({ command }) => {
      logger.info('Bash command starting', { command });
      return undefined;
    },
    onAfterBashCall: ({ command, result }) => {
      logger.info('Bash command completed', {
        command,
        exitCode: result.exitCode,
        stdoutLength: result.stdout?.length || 0,
        stderr: result.stderr || '',
      });
      return undefined;
    },
  });

  return tools;
}
