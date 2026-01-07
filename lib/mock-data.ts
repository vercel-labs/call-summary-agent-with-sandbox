/**
 * Mock Gong Data for Demo Mode
 *
 * This file loads demo data from the /demo folder for demonstrating the call summary agent
 * without requiring actual Gong API credentials.
 *
 * Demo files are organized in /demo-files/:
 * - webhook-data.json: Mock webhook payload
 * - transcript.json: Mock call transcript
 * - context/: Additional context files (CRM, research, playbooks)
 */

import fs from 'fs';
import path from 'path';
import type { GongApiResponse, GongWebhookData } from './types';

/**
 * Mock call ID used in demo mode
 */
export const MOCK_CALL_ID = 'demo-call-001';

/**
 * Load JSON file from demo folder
 */
function loadDemoJson<T>(filename: string): T {
  const filePath = path.join(process.cwd(), 'demo-files', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Load text file from demo folder
 */
function loadDemoFile(relativePath: string): string {
  const filePath = path.join(process.cwd(), 'demo-files', relativePath);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Get mock webhook data
 * In demo mode, returns the mock webhook data from demo/webhook-data.json
 */
export function getMockWebhookData(): GongWebhookData {
  return loadDemoJson<GongWebhookData>('webhook-data.json');
}

/**
 * Get mock transcript data
 * In demo mode, returns the mock data from demo/transcript.json
 */
export function getMockTranscript(): GongApiResponse {
  return loadDemoJson<GongApiResponse>('transcript.json');
}

export interface DemoContextFile {
  path: string;
  content: string;
  description: string;
}

/**
 * Demo context file definitions
 * Maps sandbox paths to demo folder paths and descriptions
 */
const DEMO_CONTEXT_FILES: Array<{
  sandboxPath: string;
  demoPath: string;
  description: string;
}> = [
  {
    sandboxPath: 'gong-calls/previous/demo-call-000-discovery-call.md',
    demoPath: 'context/gong-calls/previous/demo-call-000-discovery-call.md',
    description: 'Previous discovery call transcript',
  },
  {
    sandboxPath: 'gong-calls/previous/demo-call-intro-initial-call.md',
    demoPath: 'context/gong-calls/previous/demo-call-intro-initial-call.md',
    description: 'Initial intro call transcript',
  },
  {
    sandboxPath: 'salesforce/account.md',
    demoPath: 'context/salesforce/account.md',
    description: 'Salesforce account record',
  },
  {
    sandboxPath: 'salesforce/opportunity.md',
    demoPath: 'context/salesforce/opportunity.md',
    description: 'Salesforce opportunity record',
  },
  {
    sandboxPath: 'salesforce/contacts.md',
    demoPath: 'context/salesforce/contacts.md',
    description: 'Salesforce contact records',
  },
  {
    sandboxPath: 'research/company-research.md',
    demoPath: 'context/research/company-research.md',
    description: 'Company background research',
  },
  {
    sandboxPath: 'research/competitive-intel.md',
    demoPath: 'context/research/competitive-intel.md',
    description: 'Competitive intelligence brief',
  },
  {
    sandboxPath: 'playbooks/sales-playbook.md',
    demoPath: 'context/playbooks/sales-playbook.md',
    description: 'Sales playbook and battle card',
  },
];

/**
 * Get all demo context files for the sandbox
 * These files provide additional context for the AI agent in demo mode
 */
export function getDemoContextFiles(): DemoContextFile[] {
  return DEMO_CONTEXT_FILES.map((file) => ({
    path: file.sandboxPath,
    content: loadDemoFile(file.demoPath),
    description: file.description,
  }));
}
