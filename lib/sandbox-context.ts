/**
 * Sandbox Context Generation
 *
 * This module generates files for the Vercel Sandbox environment,
 * giving the agent access to call transcripts and related data.
 *
 * Data sources:
 * - Gong API: Call transcripts and details (primary)
 * - Salesforce: Account and opportunity data (optional)
 *
 * NOTE: For historical call analysis with better performance,
 * you can integrate with a database like Snowflake, PostgreSQL,
 * or another data warehouse to store and query call history.
 */

import type { SandboxFile, GongWebhookData } from './types';
import {
  convertTranscriptToMarkdown,
  fetchGongTranscript,
} from './gong-client';
import { getAccountData, isSalesforceEnabled } from './salesforce';

/**
 * Format account data as markdown
 */
function formatAccountMarkdown(
  accountData: Record<string, unknown>
): string {
  let md = `# Account: ${accountData.Name || 'Unknown'}\n\n`;
  md += `## Basic Information\n\n`;

  const importantFields = [
    'Id',
    'Name',
    'Industry',
    'Type',
    'Website',
    'Phone',
    'BillingCity',
    'BillingState',
    'BillingCountry',
    'NumberOfEmployees',
    'AnnualRevenue',
    'Description',
  ];

  for (const field of importantFields) {
    if (accountData[field]) {
      md += `- **${field}:** ${accountData[field]}\n`;
    }
  }

  return md;
}

/**
 * Generate files for the sandbox environment
 *
 * Creates a file structure with:
 * - gong-calls/ - Call transcript markdown files
 * - salesforce/ - CRM data (if Salesforce is enabled)
 */
export async function generateFilesForSandbox(options: {
  webhookData: GongWebhookData;
  sfdcAccountId?: string;
}): Promise<SandboxFile[]> {
  const files: SandboxFile[] = [];

  // Fetch transcript for the current call
  const transcript = await fetchGongTranscript(
    options.webhookData.callData.metaData.id
  );
  const markdown = convertTranscriptToMarkdown(transcript, options.webhookData);

  // Add main call transcript
  const callId = options.webhookData.callData.metaData.id;
  const callTitle = options.webhookData.callData.metaData.title || 'call';
  const filename = `${callId}-${callTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;

  files.push({
    path: `gong-calls/${filename}`,
    content: Buffer.from(markdown, 'utf-8'),
  });

  // Add Salesforce data if enabled and account ID is provided
  if (isSalesforceEnabled() && options.sfdcAccountId) {
    try {
      const { accountData } = await getAccountData(options.sfdcAccountId);

      if (accountData) {
        files.push({
          path: 'salesforce/account.md',
          content: Buffer.from(formatAccountMarkdown(accountData), 'utf-8'),
        });
      }
    } catch (error) {
      console.error('Failed to fetch Salesforce data:', error);
    }
  }

  // Add call metadata as JSON for easy parsing
  const metadataJson = JSON.stringify(
    {
      callId: options.webhookData.callData.metaData.id,
      title: options.webhookData.callData.metaData.title,
      scheduled: options.webhookData.callData.metaData.scheduled,
      duration: options.webhookData.callData.metaData.duration,
      system: options.webhookData.callData.metaData.system,
      participants: options.webhookData.callData.parties?.map((p) => ({
        name: p.name,
        email: p.emailAddress,
        affiliation: p.affiliation,
        title: p.title,
      })),
    },
    null,
    2
  );

  files.push({
    path: 'gong-calls/metadata.json',
    content: Buffer.from(metadataJson, 'utf-8'),
  });

  return files;
}

/**
 * Generate a file tree representation for the agent prompt
 */
export function generateFileTree(files: SandboxFile[]): string {
  const tree: string[] = ['.'];

  // Sort files by path
  const sortedPaths = files.map((f) => f.path).sort();

  // Build tree structure
  const dirs = new Set<string>();
  for (const path of sortedPaths) {
    const parts = path.split('/');
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current += (current ? '/' : '') + parts[i];
      dirs.add(current);
    }
  }

  // Add directories
  for (const dir of Array.from(dirs).sort()) {
    const depth = dir.split('/').length;
    const indent = '│   '.repeat(depth - 1) + '├── ';
    tree.push(indent + dir.split('/').pop());
  }

  // Add files
  for (const path of sortedPaths) {
    const parts = path.split('/');
    const depth = parts.length;
    const indent = '│   '.repeat(depth - 1) + '└── ';
    tree.push(indent + parts.pop());
  }

  return tree.join('\n');
}

