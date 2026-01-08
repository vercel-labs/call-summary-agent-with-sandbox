/**
 * Demo mode data loader. Loads mock data from /demo-files/ directory.
 */

import fs from 'fs';
import path from 'path';
import type { GongApiResponse, GongWebhookData } from './types';

function loadDemoJson<T>(filename: string): T {
  const filePath = path.join(process.cwd(), 'demo-files', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function loadDemoFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), 'demo-files', relativePath), 'utf-8');
}

export function getMockWebhookData(): GongWebhookData {
  return loadDemoJson<GongWebhookData>('webhook-data.json');
}

export function getMockTranscript(): GongApiResponse {
  return loadDemoJson<GongApiResponse>('transcript.json');
}

interface DemoContextFile {
  path: string;
  content: string;
  description: string;
}

const DEMO_CONTEXT_FILES: Array<{ sandboxPath: string; demoPath: string; description: string }> = [
  { sandboxPath: 'gong-calls/previous/demo-call-000-discovery-call.md', demoPath: 'context/gong-calls/previous/demo-call-000-discovery-call.md', description: 'Previous discovery call' },
  { sandboxPath: 'gong-calls/previous/demo-call-intro-initial-call.md', demoPath: 'context/gong-calls/previous/demo-call-intro-initial-call.md', description: 'Initial intro call' },
  { sandboxPath: 'salesforce/account.md', demoPath: 'context/salesforce/account.md', description: 'Salesforce account' },
  { sandboxPath: 'salesforce/opportunity.md', demoPath: 'context/salesforce/opportunity.md', description: 'Salesforce opportunity' },
  { sandboxPath: 'salesforce/contacts.md', demoPath: 'context/salesforce/contacts.md', description: 'Salesforce contacts' },
  { sandboxPath: 'research/company-research.md', demoPath: 'context/research/company-research.md', description: 'Company research' },
  { sandboxPath: 'research/competitive-intel.md', demoPath: 'context/research/competitive-intel.md', description: 'Competitive intel' },
  { sandboxPath: 'playbooks/sales-playbook.md', demoPath: 'context/playbooks/sales-playbook.md', description: 'Sales playbook' },
];

export function getDemoContextFiles(): DemoContextFile[] {
  return DEMO_CONTEXT_FILES.map((file) => ({
    path: file.sandboxPath,
    content: loadDemoFile(file.demoPath),
    description: file.description,
  }));
}
