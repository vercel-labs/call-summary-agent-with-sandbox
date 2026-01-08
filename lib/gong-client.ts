/**
 * Gong API client for fetching call transcripts and details.
 */

import { config } from './config';
import type { GongApiResponse, GongWebhookData, Party } from './types';

/**
 * Create authorization headers for Gong API requests.
 * Gong uses Basic Auth with access-key:access-secret format.
 */
function createGongHeaders(): HeadersInit {
  const { accessKey, secretKey } = config.gong;

  if (!accessKey || !secretKey) {
    throw new Error('Gong API credentials not configured');
  }

  const auth = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');

  return {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Fetch transcript for a specific call from Gong API
 */
export async function fetchGongTranscript(
  callId: string
): Promise<GongApiResponse> {
  const url = `${config.gong.baseUrl}/v2/calls/transcript`;

  const response = await fetch(url, {
    method: 'POST',
    headers: createGongHeaders(),
    body: JSON.stringify({
      filter: { callIds: [callId] },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Gong transcript: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Convert Gong transcript data to markdown format
 */
export function convertTranscriptToMarkdown(
  apiResponse: GongApiResponse,
  webhookData: GongWebhookData
): string {
  const callTranscript = apiResponse.callTranscripts[0];
  if (!callTranscript) {
    return '# No transcript available';
  }

  // Create speaker ID to party mapping
  const speakerMap = new Map<string, Party>();
  if (webhookData.callData.parties) {
    for (const party of webhookData.callData.parties) {
      if (party.speakerId) {
        speakerMap.set(party.speakerId, party);
      }
    }
  }

  // Build markdown
  let markdown = '# Call Transcript\n\n';

  // Add call metadata
  const meta = webhookData.callData.metaData;
  markdown += '## Call Information\n\n';
  markdown += `- **Call ID:** ${meta.id}\n`;
  if (meta.title) markdown += `- **Title:** ${meta.title}\n`;
  if (meta.scheduled) markdown += `- **Scheduled:** ${meta.scheduled}\n`;
  if (meta.started) markdown += `- **Started:** ${meta.started}\n`;
  if (meta.duration)
    markdown += `- **Duration:** ${formatDuration(meta.duration)}\n`;
  if (meta.system) markdown += `- **System:** ${meta.system}\n`;
  markdown += '\n';

  // Add participants section
  markdown += '## Participants\n\n';
  if (webhookData.callData.parties && webhookData.callData.parties.length > 0) {
    for (const party of webhookData.callData.parties) {
      const affiliation = party.affiliation || 'Unknown';
      markdown += `- **${party.name || 'Unknown'}** (${affiliation})`;
      if (party.emailAddress) markdown += ` - ${party.emailAddress}`;
      if (party.title) markdown += ` - ${party.title}`;
      markdown += '\n';
    }
  }
  markdown += '\n';

  // Add transcript
  markdown += '## Transcript\n\n';

  let currentTopic = '';

  for (const segment of callTranscript.transcript) {
    // Add topic header if it changed
    if (segment.topic !== currentTopic) {
      currentTopic = segment.topic;
      const topicDisplay = currentTopic || 'Conversation';
      markdown += `### ${topicDisplay}\n\n`;
    }

    // Get speaker information
    const speaker = speakerMap.get(segment.speakerId);
    const speakerName = speaker?.name || `Speaker ${segment.speakerId}`;
    const speakerInfo = speaker
      ? formatSpeakerInfo(speaker)
      : `(ID: ${segment.speakerId})`;

    // Add speaker header
    markdown += `**${speakerName}** ${speakerInfo}\n\n`;

    // Add sentences with timestamps
    for (const sentence of segment.sentences) {
      const timestamp = formatTimestamp(sentence.start);
      markdown += `> [${timestamp}] ${sentence.text}\n\n`;
    }
  }

  return markdown;
}

// Helper functions

function formatSpeakerInfo(speaker: Party): string {
  const parts: string[] = [];

  if (speaker.affiliation) {
    parts.push(speaker.affiliation);
  }

  if (speaker.emailAddress) {
    parts.push(speaker.emailAddress);
  }

  if (speaker.title) {
    parts.push(speaker.title);
  }

  return parts.length > 0 ? `_(${parts.join(', ')})_` : '';
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

