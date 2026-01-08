/**
 * Sandbox tools for the AI agent. Wraps bash-tool with logging hooks.
 */

import { createBashTool } from 'bash-tool';
import type { Sandbox } from '@vercel/sandbox';
import type { LogFn } from './agent';

/** Create agent tools with file upload and command logging */
export async function createAgentTools(
  sandbox: Sandbox,
  files: Record<string, string>,
  log: LogFn
) {
  const fileNames = Object.keys(files);
  log('info', 'sandbox', `Uploading ${fileNames.length} files to sandbox...`);
  for (const fileName of fileNames) {
    log('info', 'sandbox', `  ↑ ${fileName}`);
  }

  const { tools } = await createBashTool({
    sandbox,
    files,
    destination: '/vercel/sandbox',
    onBeforeBashCall: ({ command }) => {
      log('info', 'bash', `$ ${command}`);
      return undefined;
    },
    onAfterBashCall: ({ result }) => {
      const output = result.stdout || result.stderr;
      if (output) {
        const lines = output.trim().split('\n');
        const maxLines = 8;
        const preview = lines.slice(0, maxLines).join('\n');
        const suffix = lines.length > maxLines ? `\n... (${lines.length - maxLines} more lines)` : '';
        log('info', 'bash-output', preview + suffix);
      }
      if (result.exitCode !== 0) {
        log('warn', 'bash', `Exit code: ${result.exitCode}`);
      }
      log('info', 'agent', 'Analyzing results...');
      return undefined;
    },
  });

  log('info', 'sandbox', 'Sandbox ready');

  return tools;
}
