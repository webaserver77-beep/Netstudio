import { LiveChannel } from '../types';

export interface IPTVLogoRecord {
  channel: string;
  url: string;
  in_use?: boolean;
  tags?: string[];
  feed?: string | null;
}

export interface IPTVStreamRecord {
  channel: string;
  url: string;
  quality?: string | null;
  feed?: string | null;
  status?: string;
}

export interface IPTVChannelRecord {
  id: string;
  name: string;
  alt_names?: string[];
  network?: string | null;
  country?: string | null;
  subdivision?: string | null;
  city?: string | null;
  broadcast_area?: string[];
  languages?: string[];
  categories?: string[];
  is_nsfw?: boolean;
  launched?: string | null;
  closed?: string | null;
  replaced_by?: string | null;
  website?: string | null;
}

/**
 * Logo validation rule mandated by NetStudio IPTV standard:
 * Logo MUST match the exact channel ID.
 */
export function isValidChannelLogo(channelId: string, logo: { channel: string }): boolean {
  if (!channelId || !logo || !logo.channel) return false;
  return logo.channel.trim() === channelId.trim();
}

/**
 * Cache key generator for channel logo isolation
 */
export function getChannelLogoCacheKey(channelId: string): string {
  return `channel-logo:${channelId || 'unknown'}`;
}

/**
 * Extract clean initials or short acronym for neutral placeholder
 */
export function getChannelInitials(name: string): string {
  if (!name) return 'TV';
  const clean = name
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/TV|Television|HD|FHD|4K|Radio|News|Live|Rwanda/gi, '')
    .trim();

  if (!clean) {
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'TV';
  }

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  return words.slice(0, 3).map((w) => w[0]?.toUpperCase()).join('');
}

/**
 * Diagnostic integrity check for a LiveChannel
 */
export function validateChannelIntegrity(channel: LiveChannel): {
  isValid: boolean;
  status: 'VERIFIED' | 'NO_LOGO' | 'ERROR';
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!channel.id) {
    reasons.push('Channel ID is missing');
    return { isValid: false, status: 'ERROR', reasons };
  }

  if (!channel.name) {
    reasons.push('Channel Name is missing');
    return { isValid: false, status: 'ERROR', reasons };
  }

  if (!channel.streamUrl) {
    reasons.push('Stream URL is missing');
  }

  // Check logo validity
  if (!channel.logoUrl) {
    return {
      isValid: reasons.length === 0,
      status: 'NO_LOGO',
      reasons: ['No verified logo attached (displays neutral placeholder)']
    };
  }

  // Check if logoUrl is a known cross-channel pollution
  const isSelfConsistent =
    !channel.debugInfo ||
    !channel.debugInfo.logoChannelId ||
    channel.debugInfo.logoChannelId === channel.id;

  if (!isSelfConsistent) {
    reasons.push(
      `Logo channel mismatch: expected ${channel.id}, got ${channel.debugInfo?.logoChannelId}`
    );
    return { isValid: false, status: 'ERROR', reasons };
  }

  return {
    isValid: true,
    status: 'VERIFIED',
    reasons: ['Channel ID, stream, and logo verified']
  };
}

/**
 * Automated test suite verifying IPTV channel identities and logos
 */
export function runIPTVDiagnostics(channels: LiveChannel[]): {
  totalChannels: number;
  verifiedCount: number;
  verifiedLogos: number;
  noLogoCount: number;
  noLogos: number;
  mismatchErrors: number;
  errorCount: number;
  channels: Array<{
    channelId: string;
    name: string;
    logoUrl?: string | null;
    status: 'VERIFIED' | 'NO_LOGO' | 'ERROR';
    debugInfo?: {
      channelId: string;
      logoChannelId: string | null;
      streamChannelId: string | null;
      status: 'VERIFIED' | 'NO_LOGO' | 'ERROR';
    };
  }>;
  results: Array<{
    channelId: string;
    name: string;
    logoUrl?: string | null;
    status: 'VERIFIED' | 'NO_LOGO' | 'ERROR';
    message: string;
  }>;
} {
  const results: Array<{
    channelId: string;
    name: string;
    logoUrl: string | null;
    status: 'VERIFIED' | 'NO_LOGO' | 'ERROR';
    message: string;
  }> = [];

  let verifiedCount = 0;
  let noLogoCount = 0;
  let mismatchErrors = 0;

  // Track logo URLs to ensure no two unrelated channels share a private logo
  const logoUsageMap = new Map<string, string>(); // logoUrl -> channelId

  for (const ch of channels) {
    const integrity = validateChannelIntegrity(ch);

    let finalStatus = integrity.status;
    let finalMessage = integrity.reasons.join(', ') || 'OK';

    if (ch.logoUrl) {
      // Check for duplicate cross-channel logo assignment
      const existingChannelId = logoUsageMap.get(ch.logoUrl);
      if (existingChannelId && existingChannelId !== ch.id && !ch.logoUrl.includes('placeholder')) {
        // Warning: Logo reused across multiple channels!
        finalStatus = 'ERROR';
        finalMessage = `Logo cross-contamination detected! Reused from ${existingChannelId}`;
        mismatchErrors++;
      } else {
        logoUsageMap.set(ch.logoUrl, ch.id);
        if (finalStatus === 'VERIFIED') verifiedCount++;
      }
    } else {
      noLogoCount++;
    }

    if (finalStatus === 'ERROR' && !integrity.reasons.length) {
      mismatchErrors++;
    }

    results.push({
      channelId: ch.id,
      name: ch.name,
      logoUrl: ch.logoUrl,
      status: finalStatus,
      message: finalMessage
    });
  }

  const channelsList = channels.map(c => {
    const res = results.find(r => r.channelId === c.id);
    return {
      channelId: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      status: res?.status || 'NO_LOGO',
      debugInfo: c.debugInfo
    };
  });

  return {
    totalChannels: channels.length,
    verifiedCount,
    verifiedLogos: verifiedCount,
    noLogoCount,
    noLogos: noLogoCount,
    mismatchErrors,
    errorCount: mismatchErrors,
    channels: channelsList,
    results
  };
}
