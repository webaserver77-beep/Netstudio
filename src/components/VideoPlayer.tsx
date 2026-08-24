import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ChannelLogo } from './ChannelLogo';
import { detectAndFormatStream, ParsedStreamInfo } from '../utils/streamUtils';
import { MediaItem, Episode, MediaPart, LiveChannel } from '../types';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  ArrowLeft,
  SkipForward,
  SkipBack,
  Captions,
  Radio,
  ExternalLink,
  RefreshCw,
  Globe,
  Film,
  Check,
  AlertCircle,
  ListVideo,
  Tv,
  Layers,
  Search,
  X,
  Clock
} from 'lucide-react';

export const VideoPlayer: React.FC = () => {
  const {
    activePlayingMedia,
    stopPlayback,
    updateProgress,
    startPlayback,
    startChannelPlayback,
    channels,
    movies,
    language,
    t
  } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressSaveRef = useRef<number>(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto (1080p)');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('rw');
  const [selectedAudio, setSelectedAudio] = useState<string>('rw');
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'root' | 'speed' | 'quality' | 'subs' | 'audio'>('root');

  // Episodes / Seasons / Channels Drawer State
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'episodes' | 'parts' | 'channels'>('episodes');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [channelSearch, setChannelSearch] = useState<string>('');
  const [selectedChannelCategory, setSelectedChannelCategory] = useState<string>('all');

  // Auto-play next episode countdown state
  const [autoPlayCountdown, setAutoPlayCountdown] = useState<number | null>(null);
  const [nextContentTarget, setNextContentTarget] = useState<{
    type: 'episode' | 'part';
    item: Episode | MediaPart;
  } | null>(null);

  // Video error & mode states
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [forceIframeMode, setForceIframeMode] = useState<boolean | null>(null);
  const [usingProxy, setUsingProxy] = useState<boolean>(false);

  const media = activePlayingMedia?.media;
  const episode = activePlayingMedia?.episode;
  const part = activePlayingMedia?.part;
  const channel = activePlayingMedia?.channel;
  const isLiveStream = !!channel;

  // Reset transient player state whenever new content starts so stale
  // proxy/embed/error flags never leak into the next playback session
  useEffect(() => {
    setHasError(false);
    setErrorMessage('');
    setForceIframeMode(null);
    setUsingProxy(false);
    setShowDrawer(false);
    setShowSettingsMenu(false);
  }, [activePlayingMedia]);

  // Initialize season state if series
  useEffect(() => {
    if (episode) {
      setSelectedSeason(episode.season || 1);
      setDrawerTab('episodes');
    } else if (part) {
      setDrawerTab('parts');
    } else if (channel) {
      setDrawerTab('channels');
    }
  }, [episode, part, channel]);

  const isTrailer = activePlayingMedia?.isTrailer;

  // Determine current stream URL
  const rawUrl = channel
    ? channel.streamUrl
    : isTrailer
    ? (media?.trailerUrl || 'https://media.w3.org/2010/05/sintel/trailer.mp4')
    : episode
    ? episode.videoUrl
    : part
    ? part.videoUrl
    : media?.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4';

  const currentStreamUrl = rawUrl;

  const title = channel
    ? channel.name
    : isTrailer
    ? `${media?.title || ''} (${language === 'rw' ? 'Agace / Trailer' : 'Official Preview / Trailer'})`
    : episode
    ? `${media?.title} - S${episode.season} E${episode.episodeNumber}: ${episode.title}`
    : part
    ? `${media?.title} - ${part.title || `Part ${part.partNumber}`}`
    : media?.title || '';

  // Auto-detect stream configuration
  const streamInfo: ParsedStreamInfo = detectAndFormatStream(currentStreamUrl);

  const isIframeMode =
    forceIframeMode !== null
      ? forceIframeMode
      : streamInfo.requiresIframe ||
        streamInfo.type === 'youtube' ||
        streamInfo.type === 'vimeo' ||
        streamInfo.type === 'dailymotion' ||
        streamInfo.type === 'gdrive';

  const activeEmbedUrl = streamInfo.embedUrl || currentStreamUrl;
  const activeDirectUrl =
    usingProxy && !currentStreamUrl.startsWith('/api/iptv/proxy')
      ? `/api/iptv/proxy?url=${encodeURIComponent(currentStreamUrl)}`
      : streamInfo.directUrl || currentStreamUrl;

  // Initialize HLS or standard HTML5 video source
  useEffect(() => {
    if (isIframeMode) return;

    const video = videoRef.current;
    if (!video || !activeDirectUrl) return;

    let hls: Hls | null = null;
    setHasError(false);
    setErrorMessage('');
    setAutoPlayCountdown(null);
    setNextContentTarget(null);

    const safePlay = () => {
      if (video) {
        video
          .play()
          .then(() => {
            setIsPlaying(true);
            setHasError(false);
          })
          .catch((err) => {
            console.warn('Playback play() was rejected:', err);
            setIsPlaying(false);
          });
      }
    };

    try {
      if (activeDirectUrl.includes('.m3u8')) {
        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(activeDirectUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (activePlayingMedia?.startTime && activePlayingMedia.startTime > 0) {
              try {
                video.currentTime = activePlayingMedia.startTime;
              } catch {
                // Ignore
              }
            }
            safePlay();
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.warn('Fatal HLS error occurred:', data.type, data.details);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  if (!usingProxy && !activeDirectUrl.startsWith('/api/iptv/proxy')) {
                    setUsingProxy(true);
                  } else {
                    setHasError(true);
                    setErrorMessage('HLS stream network error. Try Web Embed Mode.');
                  }
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls?.recoverMediaError();
                  break;
                default:
                  hls?.destroy();
                  setHasError(true);
                  setErrorMessage('Stream playback error. Tap Switch to Web Embed mode.');
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native Safari HLS
          video.src = activeDirectUrl;
          if (activePlayingMedia?.startTime && activePlayingMedia.startTime > 0) {
            video.currentTime = activePlayingMedia.startTime;
          }
          safePlay();
        } else {
          setHasError(true);
          setErrorMessage('HLS video playback is not supported in this browser.');
        }
      } else {
        // Direct MP4 / WebM / Media
        video.src = activeDirectUrl;
        if (activePlayingMedia?.startTime && activePlayingMedia.startTime > 0) {
          video.currentTime = activePlayingMedia.startTime;
        }
        safePlay();
      }
    } catch (err: any) {
      console.error('Player initialization exception:', err);
      setHasError(true);
      setErrorMessage(err?.message || 'Failed to initialize player.');
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [activeDirectUrl, isIframeMode, usingProxy, activePlayingMedia?.startTime]);

  // Native Video Error handler
  const handleNativeVideoError = () => {
    if (!isIframeMode) {
      if (!usingProxy && !currentStreamUrl.startsWith('/api/iptv/proxy')) {
        setUsingProxy(true);
      } else {
        setHasError(true);
        setErrorMessage('Stream connection interrupted or CORS restricted. Tap Switch to Web Embed.');
      }
    }
  };

  // Keyboard Shortcuts (Space, F, M, Arrow Left/Right, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in drawer search
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current && !isLiveStream) {
          videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current && !isLiveStream) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
      } else if (e.key === 'Escape') {
        if (showDrawer) {
          setShowDrawer(false);
        } else if (isFullscreen) {
          exitFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen, isMuted, isLiveStream, showDrawer]);

  // Hide Controls on Mouse Inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettingsMenu && !showDrawer && autoPlayCountdown === null) {
        setShowControls(false);
      }
    }, 3500);
  }, [isPlaying, showSettingsMenu, showDrawer, autoPlayCountdown]);

  // Controls Handlers
  const togglePlay = () => {
    if (isIframeMode) return;
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);

      // Track progress for Continue Watching (throttled to avoid
      // hammering the persistence layer on every timeupdate tick)
      if (media && !isLiveStream && video.duration > 0) {
        const now = Date.now();
        if (!lastProgressSaveRef.current || now - lastProgressSaveRef.current >= 5000) {
          lastProgressSaveRef.current = now;
          updateProgress(media.id, video.currentTime, video.duration, episode?.id);
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      const nextMuted = !isMuted;
      video.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((videoRef.current as any)?.webkitEnterFullscreen) {
        (videoRef.current as any).webkitEnterFullscreen();
      }
      setIsFullscreen(true);
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setSettingsTab('root');
    setShowSettingsMenu(false);
  };

  // Next & Previous Episode Calculation
  // Support both storage layouts: flat top-level episodes and
  // episodes nested under seasons[].episodes
  const episodesList = React.useMemo(() => {
    if (!media) return [];
    // Merge BOTH storage layouts (flat + seasons[]) into ONE ordered playlist:
    // S1E1 -> S1E2 -> ... -> S2E1, so auto-advance never breaks across seasons.
    const fromSeasons = (media.seasons || []).flatMap((s) =>
      (s.episodes || []).map((ep) => ({ ...ep, season: ep.season || s.seasonNumber }))
    );
    return [...(media.episodes || []), ...fromSeasons]
      .filter((ep, i, arr) => arr.findIndex((e) => e.id === ep.id) === i)
      .sort(
        (a, b) =>
          (a.season || 1) - (b.season || 1) || (a.episodeNumber || 0) - (b.episodeNumber || 0)
      );
  }, [media]);
  const currentEpIndex = episode ? episodesList.findIndex((ep) => ep.id === episode.id) : -1;
  const hasNextEpisode = currentEpIndex >= 0 && currentEpIndex < episodesList.length - 1;
  const hasPrevEpisode = currentEpIndex > 0;

  const partsList = media?.parts || [];
  const currentPartIndex = part ? partsList.findIndex((p) => p.id === part.id) : -1;
  const hasNextPart = currentPartIndex >= 0 && currentPartIndex < partsList.length - 1;
  const hasPrevPart = currentPartIndex > 0;

  const handleNextEpisode = () => {
    if (!media) return;
    if (episode && hasNextEpisode) {
      const nextEp = episodesList[currentEpIndex + 1];
      startPlayback(media, nextEp, 0);
    } else if (part && hasNextPart) {
      const nextPart = partsList[currentPartIndex + 1];
      startPlayback(media, undefined, 0, nextPart);
    }
    setAutoPlayCountdown(null);
    setNextContentTarget(null);
  };

  const handlePrevEpisode = () => {
    if (!media) return;
    if (episode && hasPrevEpisode) {
      const prevEp = episodesList[currentEpIndex - 1];
      startPlayback(media, prevEp, 0);
    } else if (part && hasPrevPart) {
      const prevPart = partsList[currentPartIndex - 1];
      startPlayback(media, undefined, 0, prevPart);
    }
  };

  // Handle Video Ended (Auto-Play Next Episode or Part)
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (media && episode && hasNextEpisode) {
      const nextEp = episodesList[currentEpIndex + 1];
      setNextContentTarget({ type: 'episode', item: nextEp });
      setAutoPlayCountdown(5);
    } else if (media && part && hasNextPart) {
      const nextPart = partsList[currentPartIndex + 1];
      setNextContentTarget({ type: 'part', item: nextPart });
      setAutoPlayCountdown(5);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (autoPlayCountdown === null) return;

    if (autoPlayCountdown > 0) {
      autoPlayTimerRef.current = setTimeout(() => {
        setAutoPlayCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (autoPlayCountdown === 0 && nextContentTarget && media) {
      if (nextContentTarget.type === 'episode') {
        startPlayback(media, nextContentTarget.item as Episode, 0);
      } else {
        startPlayback(media, undefined, 0, nextContentTarget.item as MediaPart);
      }
      setAutoPlayCountdown(null);
      setNextContentTarget(null);
    }

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [autoPlayCountdown, nextContentTarget, media, startPlayback]);

  const cancelAutoPlay = () => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    setAutoPlayCountdown(null);
    setNextContentTarget(null);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Open stream in external window
  const handleOpenExternalStream = () => {
    if (currentStreamUrl) {
      window.open(currentStreamUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Switch Live Channel
  const handleSwitchChannel = (ch: LiveChannel) => {
    startChannelPlayback(ch);
    setShowDrawer(false);
  };

  // Filter channels for drawer
  const filteredChannels = channels.filter((ch) => {
    const matchesSearch =
      ch.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
      (ch.category && ch.category.toLowerCase().includes(channelSearch.toLowerCase()));
    const matchesCat =
      selectedChannelCategory === 'all' ||
      ch.category?.toLowerCase() === selectedChannelCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const channelCategories = [
    'all',
    ...Array.from(new Set(channels.map((c) => c.category).filter(Boolean)))
  ];

  const currentEpisodesForSeason = episodesList.filter(
    (ep) => ep.season === selectedSeason
  );

  if (!activePlayingMedia) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none ${
        isFullscreen ? 'w-screen h-screen' : 'w-full h-full'
      }`}
    >
      {/* 1. EMBED / IFRAME PLAYER MODE */}
      {isIframeMode ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <iframe
            ref={iframeRef}
            src={activeEmbedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            /* Sandbox WITHOUT allow-top-navigation / allow-popups: embedded
               sites can never reload or hijack this page again */
            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            referrerPolicy="strict-origin-when-cross-origin"
          />

          {/* Escape hatch when the source refuses embedding (X-Frame-Options) */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
            <button
              type="button"
              onClick={() => setForceIframeMode(false)}
              className="px-3 py-1.5 rounded-xl bg-black/80 border border-zinc-700 text-white text-[11px] font-bold hover:border-green-500 transition-colors cursor-pointer"
            >
              Direct Player
            </button>
            <button
              type="button"
              onClick={handleOpenExternalStream}
              className="px-3 py-1.5 rounded-xl bg-black/80 border border-zinc-700 text-zinc-300 text-[11px] font-bold hover:border-zinc-500 transition-colors cursor-pointer"
            >
              Open Source
            </button>
          </div>
        </div>
      ) : (
        /* 2. DIRECT HTML5 / HLS VIDEO PLAYER MODE */
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnded}
            onError={handleNativeVideoError}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
          />

          {/* In-Player Error Banner & 1-Click Switcher */}
          {hasError && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Native Player Stream Notice</h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6">
                {errorMessage || 'This streaming link is best viewed in Universal Web Embed Mode.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setHasError(false);
                    setForceIframeMode(true);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-black text-xs sm:text-sm flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>Switch to Web / Embed Player</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsingProxy(true);
                    setHasError(false);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry via Stream Proxy</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenExternalStream}
                  className="px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Stream Source</span>
                </button>
              </div>
            </div>
          )}

          {/* Auto-Play Next Episode/Part Overlay */}
          {autoPlayCountdown !== null && nextContentTarget && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-fade-in">
              <div className="max-w-md bg-[#111111] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/40 text-green-400 flex items-center justify-center mx-auto mb-4 font-black text-xl">
                  {autoPlayCountdown}
                </div>

                <h3 className="text-lg font-black text-white mb-1">
                  Next Up in {autoPlayCountdown} seconds
                </h3>
                <p className="text-sm font-semibold text-green-400 mb-1">
                  {nextContentTarget.type === 'episode'
                    ? `S${(nextContentTarget.item as Episode).season} E${(nextContentTarget.item as Episode).episodeNumber}: ${(nextContentTarget.item as Episode).title}`
                    : (nextContentTarget.item as MediaPart).title || `Part ${(nextContentTarget.item as MediaPart).partNumber}`}
                </p>
                <p className="text-xs text-zinc-400 mb-6">
                  {media?.title}
                </p>

                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={cancelAutoPlay}
                    className="px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      if (nextContentTarget.type === 'episode') {
                        startPlayback(media!, nextContentTarget.item as Episode, 0);
                      } else {
                        startPlayback(media!, undefined, 0, nextContentTarget.item as MediaPart);
                      }
                      cancelAutoPlay();
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-black text-xs flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Play Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Header Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-3 sm:p-5 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between transition-opacity duration-300 z-50 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-3 max-w-[60%] sm:max-w-[70%]">
          <button
            onClick={stopPlayback}
            className="p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-700 transition-colors cursor-pointer flex-shrink-0"
            title={t('backToBrowse')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {channel && (
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
              <ChannelLogo
                channelId={channel.id}
                logoUrl={channel.logoUrl ?? (channel.logo || null)}
                channelName={channel.name}
                className="w-full h-full rounded-xl"
              />
            </div>
          )}
          <div className="truncate">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-bold text-xs sm:text-base text-white truncate">{title}</span>
              {isTrailer && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 flex-shrink-0">
                  <Film className="w-2.5 h-2.5" />
                  <span>PREVIEW / TRAILER</span>
                </span>
              )}
              {isLiveStream && (
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 animate-pulse flex-shrink-0">
                  <Radio className="w-2.5 h-2.5" />
                  <span>{t('liveBadge')}</span>
                </span>
              )}
            </div>
            {channel && channel.currentProgram && (
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                {language === 'rw' && channel.currentProgramRw ? channel.currentProgramRw : channel.currentProgram}
              </p>
            )}
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Episodes / Channels Drawer Button */}
          {(media?.type === 'series' || (media?.parts && media.parts.length > 0) || isLiveStream) && (
            <button
              onClick={() => setShowDrawer(!showDrawer)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                showDrawer
                  ? 'bg-green-500 text-black border-green-400'
                  : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500 text-zinc-200'
              }`}
              title={isLiveStream ? 'Browse Live Channels' : 'Episodes & Seasons'}
            >
              {isLiveStream ? <Tv className="w-3.5 h-3.5" /> : <ListVideo className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isLiveStream ? 'Channels' : media?.type === 'series' ? 'Episodes' : 'Parts'}
              </span>
            </button>
          )}

          {media?.interpreter && (
            <span className="hidden md:inline-flex px-2.5 py-1 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-semibold">
              Agasobanuye: {media.interpreter}
            </span>
          )}

          {/* Mode Switcher Button (Native vs Web Embed) */}
          <button
            onClick={() => setForceIframeMode((prev) => (prev === null ? !isIframeMode : !prev))}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-zinc-500 text-zinc-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title={isIframeMode ? 'Switch to Native Player' : 'Switch to Web Embed Player'}
          >
            {isIframeMode ? (
              <>
                <Film className="w-3.5 h-3.5 text-green-400" />
                <span className="hidden sm:inline">Native Video</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Web Embed</span>
              </>
            )}
          </button>

          {/* Popout / External Link */}
          <button
            onClick={handleOpenExternalStream}
            className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Open Original Stream Source"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Episodes / Parts / Channels In-Player Drawer */}
      {showDrawer && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-[#111111]/95 backdrop-blur-xl border-l border-zinc-800 p-4 sm:p-5 flex flex-col z-50 shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              {isLiveStream ? (
                <Tv className="w-5 h-5 text-red-500" />
              ) : (
                <ListVideo className="w-5 h-5 text-green-400" />
              )}
              <h3 className="font-bold text-white text-base">
                {isLiveStream
                  ? 'Live TV Channels'
                  : media?.type === 'series'
                  ? 'Episodes & Seasons'
                  : 'Movie Parts'}
              </h3>
            </div>
            <button
              onClick={() => setShowDrawer(false)}
              className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area for Series */}
          {media?.type === 'series' && episodesList.length > 0 && (
            <div className="flex-1 overflow-y-auto pt-3 space-y-3">
              {/* Seasons Selector */}
              {(media.seasonsCount || 1) > 1 && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
                  {Array.from({ length: media.seasonsCount || 1 }).map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => setSelectedSeason(idx + 1)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                        selectedSeason === idx + 1
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Season {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Episodes List */}
              <div className="space-y-2">
                {currentEpisodesForSeason.map((ep) => {
                  const isCurrent = episode?.id === ep.id;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => {
                        startPlayback(media, ep, 0);
                        setShowDrawer(false);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${
                        isCurrent
                          ? 'bg-green-500/15 border-green-500/50'
                          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-600'
                      }`}
                    >
                      <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        <img
                          src={ep.thumbnail || media.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200'}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                        />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                            <Play className="w-4 h-4 fill-white text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-bold text-green-400">E{ep.episodeNumber}</span>
                          <h4 className="text-xs font-bold text-white truncate">{ep.title}</h4>
                        </div>
                        <div className="flex items-center text-[10px] text-zinc-400 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{ep.duration}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content Area for Multi-Part Movie */}
          {media?.parts && media.parts.length > 0 && (
            <div className="flex-1 overflow-y-auto pt-3 space-y-2">
              {media.parts.map((p) => {
                const isCurrent = part?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      startPlayback(media, undefined, 0, p);
                      setShowDrawer(false);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${
                      isCurrent
                        ? 'bg-green-500/15 border-green-500/50'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black text-green-400 flex-shrink-0">
                      P{p.partNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {p.title || `Part ${p.partNumber}`}
                      </h4>
                      <p className="text-[10px] text-zinc-400">{p.duration || 'Full Part'}</p>
                    </div>
                    {isCurrent && <Play className="w-4 h-4 text-green-400 fill-green-400" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Content Area for Live TV Channels */}
          {isLiveStream && (
            <div className="flex-1 overflow-y-auto pt-3 flex flex-col space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search live channels..."
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Categories */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                {channelCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedChannelCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap capitalize border transition-all cursor-pointer ${
                      selectedChannelCategory === cat
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Channel list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredChannels.map((ch) => {
                  const isCurrent = channel?.id === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => handleSwitchChannel(ch)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${
                        isCurrent
                          ? 'bg-red-500/15 border-red-500/50'
                          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-600'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                        <ChannelLogo
                          channelId={ch.id}
                          logoUrl={ch.logoUrl ?? (ch.logo || null)}
                          channelName={ch.name}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{ch.name}</h4>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {ch.currentProgram || ch.category || 'Live Broadcast'}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls Overlay (For Native Video Mode) */}
      {!isIframeMode && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-40 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Bar (Only if not live) */}
          {!isLiveStream && (
            <div className="mb-4">
              <div className="relative flex items-center group cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mt-1.5 px-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            {/* Left Playback Controls */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Previous Episode Button */}
              {(hasPrevEpisode || hasPrevPart) && (
                <button
                  onClick={handlePrevEpisode}
                  className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Previous Episode/Part"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={togglePlay}
                className="p-2.5 sm:p-3 rounded-full bg-green-500 text-black hover:bg-green-400 transition-colors cursor-pointer border border-green-400"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
              </button>

              {/* Next Episode Button */}
              {(hasNextEpisode || hasNextPart) && (
                <button
                  onClick={handleNextEpisode}
                  className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Next Episode/Part"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              )}

              {!isLiveStream && (
                <>
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime -= 10;
                    }}
                    className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="-10s"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime += 10;
                    }}
                    className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="+10s"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3 relative">
              {/* Episodes / Channels button */}
              {(media?.type === 'series' || (media?.parts && media.parts.length > 0) || isLiveStream) && (
                <button
                  onClick={() => setShowDrawer(!showDrawer)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    showDrawer ? 'text-green-400 bg-green-500/10' : 'text-zinc-400 hover:text-white'
                  }`}
                  title={isLiveStream ? 'Browse Live Channels' : 'Episodes & Seasons'}
                >
                  {isLiveStream ? <Tv className="w-5 h-5" /> : <ListVideo className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={() => {
                  setShowSettingsMenu(true);
                  setSettingsTab('subs');
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  selectedSubtitle !== 'off' ? 'text-green-400 bg-green-500/10' : 'text-zinc-400 hover:text-white'
                }`}
                title={t('subtitles')}
              >
                <Captions className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  setShowSettingsMenu(!showSettingsMenu);
                  setSettingsTab('root');
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  showSettingsMenu ? 'text-green-400 bg-green-500/10' : 'text-zinc-400 hover:text-white'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Settings Popup Menu */}
              {showSettingsMenu && (
                <div className="absolute bottom-12 right-0 w-64 bg-[#111111] border border-zinc-800 rounded-2xl p-3 shadow-2xl z-50 text-xs">
                  {settingsTab === 'root' && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-white px-2 py-1 border-b border-zinc-800">
                        Settings
                      </div>
                      <button
                        onClick={() => setSettingsTab('speed')}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 text-zinc-300 cursor-pointer"
                      >
                        <span>{t('speed')}</span>
                        <span className="text-green-400 font-bold">{playbackSpeed}x</span>
                      </button>
                      <button
                        onClick={() => setSettingsTab('quality')}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 text-zinc-300 cursor-pointer"
                      >
                        <span>{t('qualitySelect')}</span>
                        <span className="text-green-400 font-bold">{selectedQuality}</span>
                      </button>
                      <button
                        onClick={() => setSettingsTab('subs')}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 text-zinc-300 cursor-pointer"
                      >
                        <span>{t('subtitles')}</span>
                        <span className="text-green-400 font-bold uppercase">{selectedSubtitle}</span>
                      </button>
                      <button
                        onClick={() => setSettingsTab('audio')}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/80 text-zinc-300 cursor-pointer"
                      >
                        <span>{t('audioTrack')}</span>
                        <span className="text-green-400 font-bold">
                          {selectedAudio === 'rw' ? 'Agasobanuye (RW)' : 'Original (EN)'}
                        </span>
                      </button>
                    </div>
                  )}

                  {settingsTab === 'speed' && (
                    <div>
                      <div className="flex items-center justify-between font-bold text-white px-2 py-1 border-b border-zinc-800 mb-1">
                        <span>{t('speed')}</span>
                        <button onClick={() => setSettingsTab('root')} className="text-zinc-500 hover:text-white">
                          Back
                        </button>
                      </div>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => handleSpeedChange(spd)}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                        >
                          <span>{spd}x {spd === 1 ? '(Normal)' : ''}</span>
                          {playbackSpeed === spd && <Check className="w-3.5 h-3.5 text-green-400" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {settingsTab === 'quality' && (
                    <div>
                      <div className="flex items-center justify-between font-bold text-white px-2 py-1 border-b border-zinc-800 mb-1">
                        <span>{t('qualitySelect')}</span>
                        <button onClick={() => setSettingsTab('root')} className="text-zinc-500 hover:text-white">
                          Back
                        </button>
                      </div>
                      {['Auto (1080p)', '4K Ultra HD', '1080p Full HD', '720p HD', '480p SD'].map((qual) => (
                        <button
                          key={qual}
                          onClick={() => {
                            setSelectedQuality(qual);
                            setSettingsTab('root');
                            setShowSettingsMenu(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                        >
                          <span>{qual}</span>
                          {selectedQuality === qual && <Check className="w-3.5 h-3.5 text-green-400" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {settingsTab === 'subs' && (
                    <div>
                      <div className="flex items-center justify-between font-bold text-white px-2 py-1 border-b border-zinc-800 mb-1">
                        <span>{t('subtitles')}</span>
                        <button onClick={() => setSettingsTab('root')} className="text-zinc-500 hover:text-white">
                          Back
                        </button>
                      </div>
                      {[
                        { id: 'rw', label: '🇷🇼 Kinyarwanda' },
                        { id: 'en', label: '🇬🇧 English' },
                        { id: 'fr', label: '🇫🇷 Français' },
                        { id: 'off', label: t('off') }
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubtitle(sub.id);
                            setSettingsTab('root');
                            setShowSettingsMenu(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                        >
                          <span>{sub.label}</span>
                          {selectedSubtitle === sub.id && <Check className="w-3.5 h-3.5 text-green-400" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {settingsTab === 'audio' && (
                    <div>
                      <div className="flex items-center justify-between font-bold text-white px-2 py-1 border-b border-zinc-800 mb-1">
                        <span>{t('audioTrack')}</span>
                        <button onClick={() => setSettingsTab('root')} className="text-zinc-500 hover:text-white">
                          Back
                        </button>
                      </div>
                      {[
                        { id: 'rw', label: '🇷🇼 Kinyarwanda (Agasobanuye)' },
                        { id: 'en', label: '🇬🇧 English (Original Audio)' }
                      ].map((aud) => (
                        <button
                          key={aud.id}
                          onClick={() => {
                            setSelectedAudio(aud.id);
                            setSettingsTab('root');
                            setShowSettingsMenu(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                        >
                          <span>{aud.label}</span>
                          {selectedAudio === aud.id && <Check className="w-3.5 h-3.5 text-green-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
