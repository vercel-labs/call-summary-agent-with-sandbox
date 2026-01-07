/**
 * Gong Webhook and Call Types
 *
 * These types define the structure of data received from Gong webhooks
 * and the format of call transcripts.
 */

export type ISODateString = string; // e.g., "2025-10-03T12:00:18-07:00"
export type URLString = string;
export type FieldValue =
  | string
  | number
  | boolean
  | null
  | number[]
  | string[]
  | Record<string, unknown>;

/**
 * Main webhook payload from Gong
 */
export interface GongWebhook {
  callData: CallData;
  isTest: boolean;
  isPrivate: boolean;
}

/**
 * Simplified webhook data structure
 */
export interface GongWebhookData {
  callData: CallData;
}

/**
 * Call data containing metadata, participants, and content
 */
export interface CallData {
  metaData: MetaData;
  context?: CallContextEntry[];
  parties?: Party[];
  content?: Content;
  interaction?: Interaction;
  collaboration?: Record<string, unknown>;
}

/**
 * Call metadata
 */
export interface MetaData {
  id: string;
  url: URLString;
  title?: string | null;
  scheduled?: ISODateString | null;
  started?: ISODateString | null;
  duration?: number | null; // seconds
  primaryUserId?: string | null;
  direction?: string | null; // e.g., "Conference"
  system?: string | null; // e.g., "Zoom"
  scope?: string | null; // e.g., "External"
  media?: string | null; // e.g., "Video"
  language?: string | null; // e.g., "eng"
  workspaceId?: string | null;
  sdrDisposition?: string | null;
  clientUniqueId?: string | null;
  customData?: unknown | null;
  purpose?: string | null;
  meetingUrl?: URLString | null;
  isPrivate?: boolean | null;
  calendarEventId?: string | null;
}

/**
 * CRM context entry (e.g., Salesforce)
 */
export interface CallContextEntry {
  system: string; // e.g., "Salesforce"
  objects?: CallContextObject[];
}

export interface CallContextObject {
  objectType: string; // e.g., "Account", "Opportunity", "User", "Contact"
  objectId?: string;
  fields?: ContextField[];
  timing?: string;
}

export interface ContextField {
  name: string;
  value: FieldValue;
}

/**
 * Affiliation type for call participants
 */
export type Affiliation = 'Internal' | 'External' | (string & {});

/**
 * A person or participant on the call (internal or external)
 */
export interface Party {
  id: string;
  emailAddress?: string | null;
  name?: string | null;
  title?: string | null;
  userId?: string | null; // present for internal users
  speakerId?: string | null;
  context?: CallContextEntry[];
  affiliation?: Affiliation;
  phoneNumber?: string | null;
  methods?: string[]; // e.g., ["Invitee","Attendee"]
}

/**
 * Call content including trackers and topics
 */
export interface Content {
  trackers?: Tracker[];
  topics?: Topic[];
  scorecardsAnswers?: unknown[];
}

export type TrackerType = 'KEYWORD' | 'SMART' | (string & {});

export interface Tracker {
  id: string;
  name: string;
  count: number;
  type: TrackerType;
}

export interface Topic {
  name: string; // e.g., "Pricing"
  duration: number; // seconds
}

/**
 * Interaction statistics
 */
export interface Interaction {
  speakers?: Speaker[];
  interactionStats?: InteractionStat[];
  video?: VideoSegment[];
}

export interface Speaker {
  id: string;
  userId?: string | null; // only for internal speakers
  talkTime: number; // seconds
}

export interface InteractionStat {
  name: string; // e.g., "Talk Ratio"
  value: number;
}

export interface VideoSegment {
  name: string; // e.g., "Webcam", "Presentation"
  duration: number; // seconds (can be fractional)
}

/**
 * Gong API response for transcript requests
 */
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

/**
 * Extended Gong call type with full details
 */
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
      fields?: Array<{
        name: string;
        value: string;
      }>;
      timing?: string;
    }>;
  }>;
  parties?: GongParty[];
  content?: {
    structure?: Array<{
      name: string;
      duration: number;
    }>;
    topics?: GongTopic[];
    trackers?: Array<{
      id: string;
      name: string;
      count: number;
      type: string;
      occurrences?: Array<{
        startTime: number;
        speakerId: string;
      }>;
      phrases?: Array<{
        count: number;
        phrase: string;
        occurrences?: Array<{
          startTime: number;
          speakerId: string;
        }>;
      }>;
    }>;
    brief?: string;
    outline?: Array<{
      section: string;
      startTime: number;
      duration: number;
      items?: Array<{
        text: string;
        startTime: number;
      }>;
    }>;
    highlights?: Array<{
      title: string;
      items?: Array<{
        text: string;
        startTimes?: number[];
      }>;
    }>;
    callOutcome?: {
      id: string;
      category: string;
      name: string;
    };
    keyPoints?: Array<{
      text: string;
    }>;
  };
  interaction?: {
    speakers?: Array<{
      id: string;
      userId?: string;
      talkTime: number;
    }>;
    interactionStats?: Array<{
      name: string;
      value: number;
    }>;
    video?: Array<{
      name: string;
      duration: number;
    }>;
    questions?: {
      companyCount: number;
      nonCompanyCount: number;
    };
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

export interface GongTopic {
  name: string;
  duration: number;
  order?: number;
}

export interface GongParty {
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
      fields?: Array<{
        name: string;
        value: string;
      }>;
      timing?: string;
    }>;
  }>;
  affiliation: 'Internal' | 'External' | 'Unknown';
  phoneNumber?: string;
  methods?: string[];
}

export interface GongCallFile {
  filename: string;
  markdown: string;
}

