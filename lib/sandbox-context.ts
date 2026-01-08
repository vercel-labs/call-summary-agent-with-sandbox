/**
 * Sandbox Context Generation
 *
 * Generates files for the Vercel Sandbox environment,
 * giving the agent access to call transcripts and related data.
 *
 * To add Salesforce CRM data:
 * 1. Configure SF_* env vars in .env.local
 * 2. Pass sfdcAccountId to generateFilesForSandbox
 * 3. Uncomment the Salesforce section below
 */

import type { GongWebhookData } from './types';
import { convertTranscriptToMarkdown, fetchGongTranscript } from './gong-client';
// import { getAccountData, isSalesforceEnabled } from './salesforce';
import { isDemoMode } from './config';
import { getMockTranscript, getMockWebhookData, getDemoContextFiles } from './mock-data';

/**
 * Generate files for the sandbox environment
 *
 * Creates a file structure with:
 * - gong-calls/ - Call transcript markdown files
 * - salesforce/ - CRM data (if Salesforce is enabled, see header comment)
 */
export async function generateFilesForSandbox(options: {
  webhookData: GongWebhookData;
}): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  // In demo mode, use mock data instead of fetching from Gong API
  let transcript;
  let webhookData: GongWebhookData;

  if (isDemoMode()) {
    transcript = getMockTranscript();
    webhookData = getMockWebhookData();
  } else {
    transcript = await fetchGongTranscript(options.webhookData.callData.metaData.id);
    webhookData = options.webhookData;
  }

  const markdown = convertTranscriptToMarkdown(transcript, webhookData);

  // Add main call transcript
  const callId = webhookData.callData.metaData.id;
  const callTitle = webhookData.callData.metaData.title || 'call';
  const filename = `${callId}-${callTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;

  files[`gong-calls/${filename}`] = markdown;

  // To add Salesforce CRM data, uncomment:
  // if (isSalesforceEnabled() && sfdcAccountId) {
  //   const { accountData } = await getAccountData(sfdcAccountId);
  //   if (accountData) {
  //     files['salesforce/account.md'] = formatAccountMarkdown(accountData);
  //   }
  // }

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
  if (isDemoMode()) {
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
