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

/** Detailed call data from Gong REST API (more fields than webhook) */
export interface GongCall {
  metaData: {
    id: string;
    url: string;
    title: string;
    scheduled: number;
    started: number;
    duration: number;
    primaryUserId?: string;
    direction?: string;
    system?: string;
    scope?: string;
    media?: string;
    language?: string;
    workspaceId?: string;
    sdrDisposition?: string;
    clientUniqueId?: string;
    customData?: string;
    purpose?: string;
    meetingUrl?: string;
    isPrivate?: boolean;
    calendarEventId?: string;
  };
  context?: Array<{
    system: string;
    objects: Array<{
      objectType: string;
      objectId: string;
      fields?: Array<{ name: string; value: string }>;
      timing?: string;
    }>;
  }>;
  parties?: Array<{
    id: string;
    emailAddress: string;
    name: string;
    title?: string;
    userId?: string;
    speakerId?: string;
    context?: Array<{
      system: string;
      objects: Array<{
        objectType: string;
        objectId: string;
        fields?: Array<{ name: string; value: string }>;
        timing?: string;
      }>;
    }>;
    affiliation: 'Internal' | 'External' | 'Unknown';
    phoneNumber?: string;
    methods?: string[];
  }>;
  content?: {
    structure?: Array<{ name: string; duration: number }>;
    topics?: Array<{ name: string; duration: number; order?: number }>;
    trackers?: Array<{
      id: string;
      name: string;
      count: number;
      type: string;
      occurrences?: Array<{ startTime: number; speakerId: string }>;
      phrases?: Array<{
        count: number;
        phrase: string;
        occurrences?: Array<{ startTime: number; speakerId: string }>;
      }>;
    }>;
    brief?: string;
    outline?: Array<{
      section: string;
      startTime: number;
      duration: number;
      items?: Array<{ text: string; startTime: number }>;
    }>;
    highlights?: Array<{
      title: string;
      items?: Array<{ text: string; startTimes?: number[] }>;
    }>;
    callOutcome?: { id: string; category: string; name: string };
    keyPoints?: Array<{ text: string }>;
  };
  interaction?: {
    speakers?: Array<{ id: string; userId?: string; talkTime: number }>;
    interactionStats?: Array<{ name: string; value: number }>;
    video?: Array<{ name: string; duration: number }>;
    questions?: { companyCount: number; nonCompanyCount: number };
  };
  collaboration?: {
    publicComments?: Array<{
      id: string;
      audioStartTime: number;
      audioEndTime: number;
      commenterUserId: string;
      comment: string;
      posted: number;
      inReplyTo?: string;
      duringCall: boolean;
    }>;
  };
  media?: {
    audioUrl?: string;
    videoUrl?: string;
  };
}

/** Generated call file for sandbox */
export interface GongCallFile {
  filename: string;
  markdown: string;
}
