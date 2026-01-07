/**
 * Sandbox Agent Tools
 *
 * Uses bash-tool for AI agent shell command execution within the sandbox.
 */

import { createBashTool } from 'bash-tool';
import type { Sandbox } from '@vercel/sandbox';

export type LogEmitter = (
  level: 'info' | 'warn' | 'error',
  context: string,
  message: string,
  data?: Record<string, unknown>
) => Promise<void>;

/**
 * Create agent tools with bash-tool
 *
 * @param sandbox - The Vercel sandbox instance
 * @param files - Files to write to the sandbox (path -> content)
 * @param emit - Optional log emitter for streaming logs
 */
export async function createAgentTools(
  sandbox: Sandbox,
  files: Record<string, string>,
  emit?: LogEmitter
) {
  const { tools } = await createBashTool({
    sandbox,
    files,
    destination: '/vercel/sandbox',
    onBeforeBashCall: ({ command }) => {
      if (emit) emit('info', 'bash', `$ ${command}`);
      return undefined;
    },
    onAfterBashCall: () => undefined,
  });

  return tools;
}
