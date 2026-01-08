/**
 * Type definitions for Gong integration.
 *
 * Two main type families:
 * - Webhook types: Data received from Gong webhooks (GongWebhook, CallData, etc.)
 * - API types: Data from Gong REST API calls (GongCall, GongApiResponse, etc.)
 */

// ============================================================================
// WEBHOOK TYPES - Data received from Gong webhooks
// ============================================================================

/** Main webhook payload from Gong */
export interface GongWebhook {
  callData: CallData;
  isTest: boolean;
  isPrivate: boolean;
}

/** Simplified webhook data (without test/private flags) */
export interface GongWebhookData {
  callData: CallData;
}

/** Call data containing metadata, participants, and content */
export interface CallData {
  metaData: MetaData;
  context?: CallContextEntry[];
  parties?: Party[];
  content?: Content;
  interaction?: Interaction;
  collaboration?: Record<string, unknown>;
}

/** Call metadata */
export interface MetaData {
  id: string;
  url: string;
  title?: string | null;
  scheduled?: string | null;
  started?: string | null;
  duration?: number | null;
  primaryUserId?: string | null;
  direction?: string | null;
  system?: string | null;
  scope?: string | null;
  media?: string | null;
  language?: string | null;
  workspaceId?: string | null;
  sdrDisposition?: string | null;
  clientUniqueId?: string | null;
  customData?: unknown | null;
  purpose?: string | null;
  meetingUrl?: string | null;
  isPrivate?: boolean | null;
  calendarEventId?: string | null;
}

/** CRM context entry (e.g., Salesforce) */
export interface CallContextEntry {
  system: string;
  objects?: CallContextObject[];
}

export interface CallContextObject {
  objectType: string;
  objectId?: string;
  fields?: Array<{ name: string; value: unknown }>;
  timing?: string;
}

/** Call participant */
export interface Party {
  id: string;
  emailAddress?: string | null;
  name?: string | null;
  title?: string | null;
  userId?: string | null;
  speakerId?: string | null;
  context?: CallContextEntry[];
  affiliation?: 'Internal' | 'External' | string;
  phoneNumber?: string | null;
  methods?: string[];
}

/** Call content (trackers, topics) */
export interface Content {
  trackers?: Tracker[];
  topics?: Topic[];
  scorecardsAnswers?: unknown[];
}

export interface Tracker {
  id: string;
  name: string;
  count: number;
  type: 'KEYWORD' | 'SMART' | string;
}

export interface Topic {
  name: string;
  duration: number;
}

/** Interaction statistics */
export interface Interaction {
  speakers?: Speaker[];
  interactionStats?: Array<{ name: string; value: number }>;
  video?: Array<{ name: string; duration: number }>;
}

export interface Speaker {
  id: string;
  userId?: string | null;
  talkTime: number;
}

// ============================================================================
// API TYPES - Data from Gong REST API responses
// ============================================================================

/** Gong transcript API response */
export interface GongApiResponse {
  callTranscripts: Array<{
    callId: string;
    transcript: TranscriptSegment[];
  }>;
}

export interface TranscriptSegment {
  speakerId: string;
  topic: string;
  sentences: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}
