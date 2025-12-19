import { config } from './config';
import type {
  GongApiResponse,
  GongWebhookData,
  GongCall,
  GongCallFile,
  Party,
} from './types';
import slugify from 'slugify';

/**
 * Create authorization headers for Gong API requests.
 * Gong uses Basic Auth with access-key:access-secret format.
 */
export function createGongHeaders(): HeadersInit {
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
 * Fetch transcripts for multiple calls from Gong API
 */
export async function fetchGongTranscripts(
  callIds: string[]
): Promise<Map<string, GongApiResponse['callTranscripts'][number]>> {
  const results = new Map<
    string,
    GongApiResponse['callTranscripts'][number]
  >();

  if (callIds.length === 0) return results;

  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < callIds.length; i += batchSize) {
    const batch = callIds.slice(i, i + batchSize);

    try {
      const url = `${config.gong.baseUrl}/v2/calls/transcript`;
      const response = await fetch(url, {
        method: 'POST',
        headers: createGongHeaders(),
        body: JSON.stringify({
          filter: { callIds: batch },
        }),
      });

      if (!response.ok) {
        console.error(`Gong API error fetching transcripts: ${response.status}`);
        continue;
      }

      const data = (await response.json()) as GongApiResponse;
      for (const transcript of data.callTranscripts || []) {
        results.set(transcript.callId, transcript);
      }
    } catch (error) {
      console.error('Error fetching Gong transcripts:', error);
    }
  }

  return results;
}

/**
 * Fetch detailed call information from Gong API
 */
export async function fetchGongCallDetails(
  callIds: string[]
): Promise<Map<string, GongCall>> {
  const results = new Map<string, GongCall>();

  if (callIds.length === 0) return results;

  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < callIds.length; i += batchSize) {
    const batch = callIds.slice(i, i + batchSize);

    try {
      const url = `${config.gong.baseUrl}/v2/calls/extensive`;
      const response = await fetch(url, {
        method: 'POST',
        headers: createGongHeaders(),
        body: JSON.stringify({
          filter: { callIds: batch },
          contentSelector: {
            context: 'Extended',
            exposedFields: {
              parties: true,
            },
          },
        }),
      });

      if (!response.ok) {
        console.error(`Gong API error fetching call details: ${response.status}`);
        continue;
      }

      const data = (await response.json()) as { calls: GongCall[] };
      for (const call of data.calls || []) {
        results.set(call.metaData.id, call);
      }
    } catch (error) {
      console.error('Error fetching Gong call details:', error);
    }
  }

  return results;
}

/**
 * Fetch recent calls for an account from Gong API.
 *
 * NOTE: This fetches calls directly from Gong API. For historical call analysis
 * with better performance, you may want to integrate with a database like
 * Snowflake, PostgreSQL, or another data warehouse to store call history.
 */
export async function fetchRecentCalls(options: {
  fromDateTime?: string;
  toDateTime?: string;
  limit?: number;
}): Promise<GongCall[]> {
  const url = `${config.gong.baseUrl}/v2/calls`;

  const response = await fetch(url, {
    method: 'POST',
    headers: createGongHeaders(),
    body: JSON.stringify({
      filter: {
        fromDateTime: options.fromDateTime,
        toDateTime: options.toDateTime,
      },
      contentSelector: {
        context: 'Extended',
        exposedFields: {
          parties: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Gong calls: ${response.statusText}`);
  }

  const data = (await response.json()) as { calls: GongCall[] };
  return data.calls?.slice(0, options.limit) || [];
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

/**
 * Generate markdown files for all calls, suitable for sandbox context
 */
export async function generateCallFiles(
  callIds: string[]
): Promise<GongCallFile[]> {
  const callDetails = await fetchGongCallDetails(callIds);
  const transcripts = await fetchGongTranscripts(callIds);

  const gongCallFiles: GongCallFile[] = [];

  for (const callId of callIds) {
    const details = callDetails.get(callId);
    const transcript = transcripts.get(callId);

    if (!details && !transcript) {
      console.log(`Skipping call ${callId} - no data from Gong API`);
      continue;
    }

    const webhookData: GongWebhookData = {
      callData: {
        metaData: {
          id: callId,
          url: details?.metaData?.url || '',
          title: details?.metaData?.title || null,
          scheduled: details?.metaData?.scheduled
            ? new Date(details.metaData.scheduled).toISOString()
            : null,
          started: details?.metaData?.started
            ? new Date(details.metaData.started).toISOString()
            : null,
          duration: details?.metaData?.duration || null,
          system: details?.metaData?.system || null,
          meetingUrl: details?.metaData?.meetingUrl || null,
        },
        parties: details?.parties?.map((p) => ({
          id: p.id,
          emailAddress: p.emailAddress || null,
          name: p.name || null,
          title: p.title || null,
          userId: p.userId || null,
          speakerId: p.speakerId || null,
          affiliation: p.affiliation,
        })),
        context: details?.context,
      },
    };

    const apiResponse: GongApiResponse = {
      callTranscripts: transcript
        ? [{ callId, transcript: transcript.transcript }]
        : [],
    };

    const markdown = convertTranscriptToMarkdown(apiResponse, webhookData);

    const startTime = details?.metaData?.started
      ? new Date(details.metaData.started)
      : new Date();

    const filename =
      startTime
        .toISOString()
        .replace(/:/g, '-')
        .replace(/\.\d{3}Z$/, '') +
      (details?.metaData?.title
        ? `-${slugify(details.metaData.title, { lower: true })}`
        : '') +
      '.md';

    gongCallFiles.push({ filename, markdown });
  }

  return gongCallFiles;
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

