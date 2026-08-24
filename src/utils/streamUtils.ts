export type StreamType =
  | 'hls'
  | 'direct_video'
  | 'youtube'
  | 'vimeo'
  | 'dailymotion'
  | 'gdrive'
  | 'web_embed';

export interface ParsedStreamInfo {
  type: StreamType;
  rawUrl: string;
  embedUrl: string | null;
  directUrl: string | null;
  isEmbeddable: boolean;
  requiresIframe: boolean;
  canUseHtml5Video: boolean;
}

/**
 * Resolves any restricted, failing or deprecated storage bucket URLs to verified high-speed CDN streams
 */
export function sanitizeVideoUrl(url: string): string {
  if (!url || typeof url !== 'string') return 'https://vjs.zencdn.net/v/oceans.mp4';
  const trimmed = url.trim();

  // Map deprecated googleapis sample bucket or flaky archive.org downloads to fast public CDN streams
  if (
    trimmed.includes('gtv-videos-bucket') ||
    trimmed.includes('storage.googleapis.com') ||
    trimmed.includes('archive.org/download')
  ) {
    const lower = trimmed.toLowerCase();
    if (lower.includes('sintel')) {
      return 'https://media.w3.org/2010/05/sintel/trailer.mp4';
    }
    if (lower.includes('bunny') || lower.includes('bigbuckbunny')) {
      return 'https://media.w3.org/2010/05/bunny/trailer.mp4';
    }
    if (lower.includes('elephants') || lower.includes('dream') || lower.includes('blue_moon')) {
      return 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4';
    }
    if (lower.includes('tears') || lower.includes('steel') || lower.includes('ocean')) {
      return 'https://vjs.zencdn.net/v/oceans.mp4';
    }
    return 'https://vjs.zencdn.net/v/oceans.mp4';
  }

  return trimmed;
}

export function detectAndFormatStream(url: string | undefined | null): ParsedStreamInfo {
  if (!url || typeof url !== 'string') {
    return {
      type: 'direct_video',
      rawUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      embedUrl: null,
      directUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      isEmbeddable: false,
      requiresIframe: false,
      canUseHtml5Video: true
    };
  }

  const trimmed = sanitizeVideoUrl(url);

  // 1. YouTube
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      rawUrl: trimmed,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&playsinline=1`,
      directUrl: null,
      isEmbeddable: true,
      requiresIframe: true,
      canUseHtml5Video: false
    };
  }

  // 2. Vimeo
  const vimeoMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:player\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|video\/|)(\d+)(?:|\/\?)/i);
  if (vimeoMatch && vimeoMatch[2]) {
    const videoId = vimeoMatch[2];
    return {
      type: 'vimeo',
      rawUrl: trimmed,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`,
      directUrl: null,
      isEmbeddable: true,
      requiresIframe: true,
      canUseHtml5Video: false
    };
  }

  // 3. Dailymotion
  const dailyMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com\/(?:video|embed\/video)|dai\.ly)\/([a-zA-Z0-9]+)/i);
  if (dailyMatch && dailyMatch[1]) {
    const videoId = dailyMatch[1];
    return {
      type: 'dailymotion',
      rawUrl: trimmed,
      embedUrl: `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`,
      directUrl: null,
      isEmbeddable: true,
      requiresIframe: true,
      canUseHtml5Video: false
    };
  }

  // 4. Google Drive
  const gdriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1];
    return {
      type: 'gdrive',
      rawUrl: trimmed,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      directUrl: null,
      isEmbeddable: true,
      requiresIframe: true,
      canUseHtml5Video: false
    };
  }

  // 5. Dropbox
  if (trimmed.includes('dropbox.com/s/')) {
    const directDropbox = trimmed.replace('?dl=0', '?dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    return {
      type: 'direct_video',
      rawUrl: trimmed,
      embedUrl: null,
      directUrl: directDropbox,
      isEmbeddable: false,
      requiresIframe: false,
      canUseHtml5Video: true
    };
  }

  // 6. HLS Stream (.m3u8)
  if (trimmed.toLowerCase().includes('.m3u8')) {
    return {
      type: 'hls',
      rawUrl: trimmed,
      embedUrl: null,
      directUrl: trimmed,
      isEmbeddable: false,
      requiresIframe: false,
      canUseHtml5Video: true
    };
  }

  // 7. Direct video files (.mp4, .webm, .ogg, .mkv, .mov)
  const isDirectFile = /\.(mp4|webm|ogg|mkv|mov|ts|m4v)(\?.*)?$/i.test(trimmed);
  if (isDirectFile) {
    return {
      type: 'direct_video',
      rawUrl: trimmed,
      embedUrl: null,
      directUrl: trimmed,
      isEmbeddable: false,
      requiresIframe: false,
      canUseHtml5Video: true
    };
  }

  // 8. Embed streaming websites (e.g. streamtape, vidsrc, superembed, filemoon, doodstream, mixdrop, etc. or any other website)
  const isEmbedDomain =
    trimmed.includes('/embed/') ||
    trimmed.includes('/e/') ||
    trimmed.includes('/v/') ||
    trimmed.includes('vidsrc') ||
    trimmed.includes('superembed') ||
    trimmed.includes('streamtape') ||
    trimmed.includes('filemoon') ||
    trimmed.includes('dood') ||
    trimmed.includes('mixdrop') ||
    trimmed.includes('streamwish') ||
    trimmed.includes('vidcloud') ||
    trimmed.includes('upstream') ||
    trimmed.includes('mp4upload') ||
    trimmed.includes('streamin');

  if (isEmbedDomain) {
    return {
      type: 'web_embed',
      rawUrl: trimmed,
      embedUrl: trimmed,
      directUrl: null,
      isEmbeddable: true,
      requiresIframe: true,
      canUseHtml5Video: false
    };
  }

  // 9. If it's any http/https URL that is not a direct video file, treat as universal web embed by default
  // but allow fallback toggle in player!
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return {
      type: 'web_embed',
      rawUrl: trimmed,
      embedUrl: trimmed,
      directUrl: trimmed,
      isEmbeddable: true,
      requiresIframe: true,
      canUseHtml5Video: true
    };
  }

  // Default fallback
  return {
    type: 'direct_video',
    rawUrl: trimmed,
    embedUrl: null,
    directUrl: trimmed,
    isEmbeddable: false,
    requiresIframe: false,
    canUseHtml5Video: true
  };
}
