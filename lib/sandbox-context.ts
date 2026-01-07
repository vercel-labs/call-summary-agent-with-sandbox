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

import type { GongWebhookData } from './types';
import {
  convertTranscriptToMarkdown,
  fetchGongTranscript,
} from './gong-client';
import { getAccountData, isSalesforceEnabled } from './salesforce';
import { config } from './config';
import {
  getMockTranscript,
  getMockWebhookData,
  getDemoContextFiles,
} from './mock-data';

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
 *
 * @returns Record<string, string> - Map of file paths to content
 */
export async function generateFilesForSandbox(options: {
  webhookData: GongWebhookData;
  sfdcAccountId?: string;
}): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  // In demo mode, use mock data instead of fetching from Gong API
  let transcript;
  let webhookData: GongWebhookData;

  if (config.demo.enabled) {
    transcript = getMockTranscript();
    webhookData = getMockWebhookData();
  } else {
    transcript = await fetchGongTranscript(
      options.webhookData.callData.metaData.id
    );
    webhookData = options.webhookData;
  }

  const markdown = convertTranscriptToMarkdown(transcript, webhookData);

  // Add main call transcript
  const callId = webhookData.callData.metaData.id;
  const callTitle = webhookData.callData.metaData.title || 'call';
  const filename = `${callId}-${callTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;

  files[`gong-calls/${filename}`] = markdown;

  // Add Salesforce data if enabled and account ID is provided
  if (isSalesforceEnabled() && options.sfdcAccountId) {
    try {
      const { accountData } = await getAccountData(options.sfdcAccountId);

      if (accountData) {
        files['salesforce/account.md'] = formatAccountMarkdown(accountData);
      }
    } catch (error) {
      console.error('Failed to fetch Salesforce data:', error);
    }
  }

  // Add call metadata as JSON for easy parsing
  const metadataJson = JSON.stringify(
    {
      callId: webhookData.callData.metaData.id,
      title: webhookData.callData.metaData.title,
      scheduled: webhookData.callData.metaData.scheduled,
      duration: webhookData.callData.metaData.duration,
      system: webhookData.callData.metaData.system,
      participants: webhookData.callData.parties?.map((p) => ({
        name: p.name,
        email: p.emailAddress,
        affiliation: p.affiliation,
        title: p.title,
      })),
    },
    null,
    2
  );

  files['gong-calls/metadata.json'] = metadataJson;

  // In demo mode, add additional context files
  if (config.demo.enabled) {
    const demoFiles = getDemoContextFiles();
    for (const demoFile of demoFiles) {
      files[demoFile.path] = demoFile.content;
    }
    console.log(`Demo mode: loaded ${demoFiles.length} additional context files`);
  }

  return files;
}

/**
 * Generate a file tree representation for the agent prompt
 */
export function generateFileTree(files: Record<string, string>): string {
  const tree: string[] = ['.'];

  // Sort files by path
  const sortedPaths = Object.keys(files).sort();

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
