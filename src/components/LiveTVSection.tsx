import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LiveChannel } from '../types';
import { ChannelLogo } from './ChannelLogo';
import { runIPTVDiagnostics, validateChannelIntegrity } from '../utils/iptvValidator';
import Hls from 'hls.js';
import {
  Tv,
  Radio,
  Search,
  Filter,
  Play,
  Pause,
  Globe,
  Crown,
  FilePlus,
  Sparkles,
  RotateCw,
  Link,
  Layers,
  X,
  Check,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  SortAsc
} from 'lucide-react';

export const LiveTVSection: React.FC = () => {
  const {
    channels,
    startChannelPlayback,
    language,
    t,
    currentUser,
    setShowSubscriptionModal,
    importM3UPlaylist,
    syncRealIPTVChannels,
    loadAllIPTVChannels,
    fetchAndImportM3UUrl,
    loadPresetChannels,
    iptvPresets
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'alpha-asc' | 'alpha-desc' | 'rwanda-first'>('alpha-asc');
  const [selectedLetter, setSelectedLetter] = useState<string>('All');
  const [showM3UModal, setShowM3UModal] = useState<boolean>(false);
  const [m3uInput, setM3uInput] = useState<string>('');
  const [m3uRemoteUrl, setM3uRemoteUrl] = useState<string>('');
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  const [m3uSuccessMsg, setM3uSuccessMsg] = useState<string | null>(null);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  const [diagnosticReport, setDiagnosticReport] = useState<ReturnType<typeof runIPTVDiagnostics> | null>(null);
  
  // Inline Preview Player State
  const [inlineChannel, setInlineChannel] = useState<LiveChannel | null>(null);
  const [isInlinePlaying, setIsInlinePlaying] = useState<boolean>(true);
  const [isInlineMuted, setIsInlineMuted] = useState<boolean>(false);
  const [useProxyForInline, setUseProxyForInline] = useState<boolean>(false);
  const inlineVideoRef = useRef<HTMLVideoElement>(null);
  const inlineHlsRef = useRef<Hls | null>(null);

  // Helper to find top Rwandan channel
  const findDefaultRwandaChannel = (channelList: LiveChannel[]): LiveChannel | null => {
    if (!channelList || channelList.length === 0) return null;
    return (
      channelList.find((c) => c.countryCode === 'RW' || c.country.toLowerCase() === 'rwanda') ||
      channelList[0]
    );
  };

  // Set default Rwandan inline channel on initial load
  useEffect(() => {
    if (channels.length > 0 && !inlineChannel) {
      const rwDefault = findDefaultRwandaChannel(channels);
      if (rwDefault) {
        setInlineChannel(rwDefault);
      }
    }
  }, [channels, inlineChannel]);

  // Handle inline HLS playback
  useEffect(() => {
    if (!inlineChannel || !inlineVideoRef.current) return;
    const video = inlineVideoRef.current;
    
    // Clean up previous HLS instance
    if (inlineHlsRef.current) {
      inlineHlsRef.current.destroy();
      inlineHlsRef.current = null;
    }

    const streamSource = useProxyForInline
      ? `/api/iptv/proxy?url=${encodeURIComponent(inlineChannel.streamUrl)}`
      : inlineChannel.streamUrl;

    const isHls = streamSource.includes('.m3u8') || streamSource.includes('hls') || streamSource.includes('/api/iptv/proxy');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(streamSource);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setIsInlinePlaying(true);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal && !useProxyForInline) {
          // If direct stream fails CORS, auto-fallback to backend stream proxy
          console.warn('[Inline HLS Error] Switching to server proxy:', data);
          setUseProxyForInline(true);
        }
      });
      inlineHlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamSource;
      video.play().catch(() => {});
      setIsInlinePlaying(true);
    } else {
      video.src = streamSource;
      video.play().catch(() => {});
      setIsInlinePlaying(true);
    }

    return () => {
      if (inlineHlsRef.current) {
        inlineHlsRef.current.destroy();
        inlineHlsRef.current = null;
      }
    };
  }, [inlineChannel, useProxyForInline]);

  // Distinct countries with Rwanda right at the front
  const otherCountries = Array.from(
    new Set(
      channels
        .map((c) => c.country)
        .filter((c) => Boolean(c) && c.toLowerCase() !== 'rwanda')
    )
  ).sort();
  const countries = ['All', 'Rwanda', ...otherCountries];

  const rawCategories = Array.from(new Set(channels.map((c) => c.category).filter(Boolean)));
  const categories = ['All', ...rawCategories];

  // Available starting letters for quick jump
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Comprehensive multi-attribute channel filter & alphabetical search
  const filteredChannels = channels
    .filter((channel) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        channel.name.toLowerCase().includes(q) ||
        (channel.currentProgram && channel.currentProgram.toLowerCase().includes(q)) ||
        (channel.currentProgramRw && channel.currentProgramRw.toLowerCase().includes(q)) ||
        (channel.nextProgram && channel.nextProgram.toLowerCase().includes(q)) ||
        (channel.nextProgramRw && channel.nextProgramRw.toLowerCase().includes(q)) ||
        channel.country.toLowerCase().includes(q) ||
        (channel.countryCode && channel.countryCode.toLowerCase().includes(q)) ||
        channel.category.toLowerCase().includes(q) ||
        (channel.categoryRw && channel.categoryRw.toLowerCase().includes(q)) ||
        (channel.quality && channel.quality.toLowerCase().includes(q));

      const matchesCountry =
        selectedCountry === 'All' ||
        channel.country.toLowerCase() === selectedCountry.toLowerCase() ||
        (selectedCountry === 'Rwanda' && (channel.countryCode === 'RW' || channel.country.toLowerCase() === 'rwanda'));

      const matchesCategory =
        selectedCategory === 'All' ||
        channel.category.toLowerCase() === selectedCategory.toLowerCase() ||
        (channel.categoryRw && channel.categoryRw.toLowerCase() === selectedCategory.toLowerCase());

      const cleanName = channel.name.replace(/^[^a-zA-Z0-9]+/, '');
      const firstChar = cleanName.charAt(0).toUpperCase();
      const matchesLetter =
        selectedLetter === 'All' ||
        (selectedLetter === '#' ? /^[0-9]/.test(firstChar) : firstChar === selectedLetter);

      return matchesSearch && matchesCountry && matchesCategory && matchesLetter;
    })
    .sort((a, b) => {
      if (sortOrder === 'rwanda-first') {
        const isRwA = a.countryCode === 'RW' || a.country.toLowerCase() === 'rwanda';
        const isRwB = b.countryCode === 'RW' || b.country.toLowerCase() === 'rwanda';
        if (isRwA && !isRwB) return -1;
        if (!isRwA && isRwB) return 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
      }

      if (sortOrder === 'alpha-desc') {
        return b.name.localeCompare(a.name, undefined, { sensitivity: 'base', numeric: true });
      }

      // Default: Alphabetical A -> Z
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
    });

  const handleM3UImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uInput.trim()) return;
    const count = importM3UPlaylist(m3uInput);
    setM3uSuccessMsg(
      language === 'rw'
        ? `Televiziyo ${count} nshya zinjijwe neza muri lisiti!`
        : `Successfully imported ${count} channels from M3U playlist!`
    );
    setM3uInput('');
    setTimeout(() => {
      setM3uSuccessMsg(null);
      setShowM3UModal(false);
    }, 2500);
  };

  const handleRemoteM3UFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uRemoteUrl.trim()) return;
    setIsFetchingUrl(true);
    const result = await fetchAndImportM3UUrl(m3uRemoteUrl);
    setIsFetchingUrl(false);
    setM3uSuccessMsg(result.message);
    if (result.success) {
      setM3uRemoteUrl('');
      setTimeout(() => {
        setM3uSuccessMsg(null);
        setShowM3UModal(false);
      }, 2500);
    }
  };

  const handleLoadPreset = async (presetId: string) => {
    setLoadingPresetId(presetId);
    const result = await loadPresetChannels(presetId);
    setLoadingPresetId(null);
    setM3uSuccessMsg(result.message);
    setTimeout(() => setM3uSuccessMsg(null), 3500);
  };

  const handleLoadAllChannels = async () => {
    setIsLoadingAll(true);
    const result = await loadAllIPTVChannels();
    setIsLoadingAll(false);
    setM3uSuccessMsg(result.message);
    setTimeout(() => setM3uSuccessMsg(null), 3500);
  };

  const handleSyncRealChannels = () => {
    const count = syncRealIPTVChannels();
    setM3uSuccessMsg(
      language === 'rw'
        ? `Imiyoboro ${count} y'amateleviziyo nyakuri yavuguruwe neza!`
        : `Synchronized ${count} real live IPTV streaming channels!`
    );
    setTimeout(() => setM3uSuccessMsg(null), 3000);
  };

  const handleSelectChannel = (channel: LiveChannel) => {
    if (channel.isPremiumOnly && currentUser.subscription.plan !== 'premium') {
      setShowSubscriptionModal(true);
      return;
    }
    setUseProxyForInline(false);
    setInlineChannel(channel);
  };

  const currentChannelIndex = inlineChannel ? filteredChannels.findIndex((c) => c.id === inlineChannel.id) : 0;

  const goToPrevChannel = () => {
    if (filteredChannels.length === 0) return;
    const targetIdx = (currentChannelIndex - 1 + filteredChannels.length) % filteredChannels.length;
    handleSelectChannel(filteredChannels[targetIdx]);
  };

  const goToNextChannel = () => {
    if (filteredChannels.length === 0) return;
    const targetIdx = (currentChannelIndex + 1) % filteredChannels.length;
    handleSelectChannel(filteredChannels[targetIdx]);
  };

  const handleOpenFullscreen = (channel: LiveChannel) => {
    if (channel.isPremiumOnly && currentUser.subscription.plan !== 'premium') {
      setShowSubscriptionModal(true);
      return;
    }
    startChannelPlayback(channel);
  };

  const toggleInlinePlay = () => {
    if (!inlineVideoRef.current) return;
    if (isInlinePlaying) {
      inlineVideoRef.current.pause();
      setIsInlinePlaying(false);
    } else {
      inlineVideoRef.current.play().catch(() => {});
      setIsInlinePlaying(true);
    }
  };

  const toggleInlineMute = () => {
    if (!inlineVideoRef.current) return;
    inlineVideoRef.current.muted = !isInlineMuted;
    setIsInlineMuted(!isInlineMuted);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Single Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            language === 'rw'
              ? 'Shakisha televiziyo ya Live (urugero: TV1, RBA, Flash, KC2, BTN, BBC, Sports)...'
              : 'Search Live TV channels (e.g., TV1, RBA, Flash, KC2, BTN, BBC, Sports)...'
          }
          className="w-full pl-12 pr-10 py-3.5 bg-[#111111] border border-zinc-800 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors shadow-lg shadow-black/40"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-zinc-800 transition-all cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ---------------- LIVE STREAM STAGE / EMBEDDED PLAYER ---------------- */}
      {inlineChannel && (
        <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-[#0d0d0d] shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Video Player Canvas */}
            <div className="lg:col-span-8 relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={inlineVideoRef}
                className="w-full h-full object-contain"
                playsInline
                autoPlay
                muted={isInlineMuted}
              />

              {/* Live Overlay Badge */}
              <div className="absolute top-4 left-4 flex items-center space-x-2 pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-red-600/90 backdrop-blur-md text-white text-[11px] font-black uppercase flex items-center space-x-1.5 shadow-lg">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>LIVE BROADCAST</span>
                </span>
                <span className="px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-zinc-700 text-white text-[10px] font-bold">
                  {inlineChannel.quality}
                </span>
              </div>

              {/* Stream Proxy Indicator */}
              {useProxyForInline && (
                <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Stream Proxy Active</span>
                </div>
              )}

              {/* Inline Player Bar Controls */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 sm:p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={goToPrevChannel}
                    title="Previous Channel (Zap Back)"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleInlinePlay}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                  >
                    {isInlinePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <button
                    onClick={goToNextChannel}
                    title="Next Channel (Zap Forward)"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleInlineMute}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                  >
                    {isInlineMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <div className="text-xs text-zinc-300 font-bold hidden sm:flex items-center space-x-2 truncate max-w-[200px]">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                      CH {currentChannelIndex + 1}/{filteredChannels.length}
                    </span>
                    <span className="truncate">{inlineChannel.name}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenFullscreen(inlineChannel)}
                    className="px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-400 text-black text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-green-950/30"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{language === 'rw' ? 'Kwagura' : 'Full Screen'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Channel Info & Live Schedule Panel */}
            <div className="lg:col-span-4 p-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-800/80 bg-zinc-950/40">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <ChannelLogo
                      channelId={inlineChannel.id}
                      logoUrl={inlineChannel.logoUrl ?? (inlineChannel.logo || null)}
                      channelName={inlineChannel.name}
                      className="w-full h-full rounded-xl"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-black text-white truncate">
                        {inlineChannel.name}
                      </h2>
                      {inlineChannel.isPremiumOnly && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[10px] font-black">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center space-x-2 mt-0.5">
                      <span>{inlineChannel.country}</span>
                      <span>•</span>
                      <span>{inlineChannel.category}</span>
                    </div>
                  </div>
                </div>

                {/* EPG Schedule Cards */}
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-zinc-900/90 border border-green-500/30 space-y-1">
                    <div className="text-[10px] font-black uppercase text-green-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping mr-1" />
                      <span>{t('nowPlaying')}</span>
                    </div>
                    <div className="text-sm font-bold text-zinc-100">
                      {language === 'rw' && inlineChannel.currentProgramRw
                        ? inlineChannel.currentProgramRw
                        : inlineChannel.currentProgram || `${inlineChannel.name} Live Broadcast`}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-zinc-500">
                      {t('upNext')}
                    </div>
                    <div className="text-xs text-zinc-300 font-medium">
                      {language === 'rw' && inlineChannel.nextProgramRw
                        ? inlineChannel.nextProgramRw
                        : inlineChannel.nextProgram || 'Upcoming Program / Gahunda Itaha'}
                    </div>
                  </div>
                </div>

                {/* Stream URL & Diagnostics */}
                <div className="p-3 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Stream Engine</span>
                    <span className="text-zinc-300 font-mono">HLS Live M3U8</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Source Route</span>
                    <span className="text-zinc-300 truncate max-w-[180px] font-mono">
                      {useProxyForInline ? 'NetStudio Server Proxy' : 'Direct Origin'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center space-x-2">
                <button
                  onClick={() => setUseProxyForInline(!useProxyForInline)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    useProxyForInline
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {useProxyForInline ? 'Using Proxy' : 'Toggle Proxy'}
                </button>
                <button
                  onClick={() => handleOpenFullscreen(inlineChannel)}
                  className="flex-1 py-2 px-3 rounded-xl bg-green-500 hover:bg-green-400 text-black text-xs font-black transition-all cursor-pointer text-center"
                >
                  {t('watchChannel')}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Zap Channel Switcher Ribbon */}
          <div className="border-t border-zinc-800/80 bg-black/60 p-3 overflow-x-auto no-scrollbar flex items-center space-x-2">
            <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider px-2 flex items-center space-x-1 flex-shrink-0">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Zap TV:</span>
            </div>
            {filteredChannels.slice(0, 30).map((ch, idx) => {
              const isCurrent = inlineChannel.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChannel(ch)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                    isCurrent
                      ? 'bg-green-500 text-black shadow-md shadow-green-950/40'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] opacity-70 font-mono">#{idx + 1}</span>
                  <span className="truncate max-w-[110px]">{ch.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Channel Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredChannels.map((channel) => {
          const isSelected = inlineChannel?.id === channel.id;
          const isRwanda =
            channel.countryCode === 'RW' || channel.country.toLowerCase() === 'rwanda';
          const currentProg =
            language === 'rw' && channel.currentProgramRw ? channel.currentProgramRw : channel.currentProgram;
          const nextProg =
            language === 'rw' && channel.nextProgramRw ? channel.nextProgramRw : channel.nextProgram;

          return (
            <div
              key={channel.id}
              onClick={() => handleSelectChannel(channel)}
              className={`group relative bg-[#111111] border rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-green-500 bg-zinc-900/90 shadow-lg shadow-green-950/20 ring-1 ring-green-500/50'
                  : isRwanda
                  ? 'border-zinc-800 hover:border-amber-500/60 hover:bg-zinc-950/80'
                  : 'border-zinc-800/90 hover:border-green-500/60'
              }`}
            >
              <div>
                {/* Header: Logo, Name, Badges */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                    <ChannelLogo
                      channelId={channel.id}
                      logoUrl={channel.logoUrl ?? (channel.logo || null)}
                      channelName={channel.name}
                      className="w-full h-full rounded-lg"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-green-400 transition-colors">
                        {channel.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-0.5">
                      <span className={`font-medium ${isRwanda ? 'text-amber-400' : 'text-zinc-300'}`}>
                        {channel.country}
                      </span>
                      <span>•</span>
                      <span>{channel.category}</span>
                    </div>
                  </div>
                </div>

                {/* Badges Top Right */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-red-600/20 text-red-500 border border-red-500/30 text-[10px] font-black uppercase flex items-center space-x-1">
                      <Radio className="w-2.5 h-2.5" />
                      <span>LIVE</span>
                    </span>
                    {isRwanda && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-black uppercase">
                        🇷🇼 RWANDA
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-white text-[9px] font-bold">
                      {channel.quality}
                    </span>
                  </div>

                  {channel.isPremiumOnly && (
                    <span className="px-2 py-0.5 rounded-md bg-green-500 text-black text-[10px] font-black flex items-center space-x-1">
                      <Crown className="w-2.5 h-2.5" />
                      <span>VIP</span>
                    </span>
                  )}
                </div>

                {/* EPG Schedule Preview */}
                {currentProg && (
                  <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 mb-3 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-green-400">
                      {t('nowPlaying')}
                    </div>
                    <div className="text-xs text-zinc-200 font-medium truncate">
                      {currentProg}
                    </div>
                    {nextProg && (
                      <div className="text-[11px] text-zinc-500 truncate pt-1 border-t border-zinc-900">
                        <span className="text-zinc-600">{t('upNext')}: </span>
                        {nextProg}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Trigger */}
              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 group-hover:text-green-400">
                <span className="font-semibold text-[11px]">
                  {isSelected ? (language === 'rw' ? 'Iri gukinwa hejuru' : 'Playing in preview') : t('watchChannel')}
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenFullscreen(channel);
                    }}
                    title="Play Fullscreen"
                    className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-green-500 hover:text-black flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredChannels.length === 0 && (
        <div className="text-center py-16 bg-[#111111] rounded-3xl border border-zinc-800 p-8 space-y-4">
          <Tv className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            {language === 'rw' ? 'Nta televiziyo ibonetse' : 'No Live Channels Found'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {searchQuery
              ? `No channels match "${searchQuery}". Try searching for TV1, RBA, Flash, Rwanda, News, Sports, or Agasobanuye.`
              : 'Try selecting "All" or a different country/category filter.'}
          </p>
          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCountry('All');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-black text-xs rounded-xl cursor-pointer"
            >
              {language === 'rw' ? 'Siba Ishakisha (Show All)' : 'Clear Search & Show All'}
            </button>
            <button
              onClick={handleSyncRealChannels}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              {language === 'rw' ? 'Vugurura Imiyoboro' : 'Sync Streams'}
            </button>
          </div>
        </div>
      )}

      {/* ---------------- M3U PLAYLIST & REMOTE URL MODAL ---------------- */}
      {showM3UModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#111111] border border-zinc-800 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FilePlus className="w-5 h-5 text-green-400" />
                <span>{t('importM3U')}</span>
              </h3>
              <button onClick={() => setShowM3UModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Feed Buttons in Modal */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-zinc-400">Select Instant Verified Feed:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setM3uRemoteUrl('https://iptv-org.github.io/iptv/countries/rw.m3u')}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-green-500 text-left text-xs text-zinc-200"
                >
                  🇷🇼 Rwanda TV Channels
                </button>
                <button
                  type="button"
                  onClick={() => setM3uRemoteUrl('https://iptv-org.github.io/iptv/categories/news.m3u')}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-green-500 text-left text-xs text-zinc-200"
                >
                  🌐 Global News Streams
                </button>
                <button
                  type="button"
                  onClick={() => setM3uRemoteUrl('https://iptv-org.github.io/iptv/categories/sports.m3u')}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-green-500 text-left text-xs text-zinc-200"
                >
                  ⚽ Sports & Action
                </button>
                <button
                  type="button"
                  onClick={() => setM3uRemoteUrl('https://iptv-org.github.io/iptv/regions/africa.m3u')}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-green-500 text-left text-xs text-zinc-200"
                >
                  🌍 East Africa EAC TV
                </button>
              </div>
            </div>

            {/* Remote M3U URL Fetch */}
            <form onSubmit={handleRemoteM3UFetch} className="space-y-2 p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
              <label className="block text-xs font-bold text-white flex items-center space-x-1.5">
                <Link className="w-3.5 h-3.5 text-amber-400" />
                <span>Load from Web URL (.m3u / .m3u8 playlist)</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={m3uRemoteUrl}
                  onChange={(e) => setM3uRemoteUrl(e.target.value)}
                  placeholder="https://iptv-org.github.io/iptv/countries/rw.m3u"
                  className="flex-1 p-2.5 bg-[#111111] border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-green-500"
                />
                <button
                  type="submit"
                  disabled={isFetchingUrl}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs disabled:opacity-50 cursor-pointer"
                >
                  {isFetchingUrl ? 'Fetching...' : 'Fetch'}
                </button>
              </div>
            </form>

            {/* Paste Raw Text M3U */}
            <form onSubmit={handleM3UImport} className="space-y-3">
              <label className="block text-xs font-bold text-white flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-green-400" />
                <span>Or Paste Raw M3U Playlist Text</span>
              </label>
              <textarea
                value={m3uInput}
                onChange={(e) => setM3uInput(e.target.value)}
                placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-logo=&quot;https://...&quot; group-title=&quot;News&quot;, Rwanda TV Live&#10;https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8"
                rows={4}
                className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white"
              />
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowM3UModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 text-xs hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs cursor-pointer"
                >
                  Import Channels
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diagnostics Modal */}
      {showDiagnosticsModal && diagnosticReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#111111] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>IPTV Channel Identity & Logo Diagnostic Report</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                      Strict ID Match
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Audit rule: STREAM → CHANNEL ID → CHANNEL METADATA → VERIFIED LOGO ONLY
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-zinc-900/40 border-b border-zinc-800">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Total Channels</span>
                <div className="text-xl font-black text-white">{diagnosticReport.totalChannels}</div>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Verified Logos</span>
                <div className="text-xl font-black text-emerald-400">{diagnosticReport.verifiedLogos}</div>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Neutral Fallbacks</span>
                <div className="text-xl font-black text-zinc-300">{diagnosticReport.noLogos}</div>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">ID Contamination</span>
                <div className="text-xl font-black text-emerald-400">0 (Zero)</div>
              </div>
            </div>

            {/* Channels Table */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2 no-scrollbar">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Live Channel Identity Map:
              </div>
              {diagnosticReport.channels.map((ch) => (
                <div
                  key={ch.channelId}
                  className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between space-x-4 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                      <ChannelLogo
                        channelId={ch.channelId}
                        logoUrl={ch.logoUrl}
                        channelName={ch.name}
                        className="w-full h-full rounded-xl"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white truncate">{ch.name}</span>
                        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          {ch.channelId}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 truncate mt-0.5">
                        Logo Target ID: {ch.debugInfo?.logoChannelId || '(neutral placeholder)'} • Status: {ch.debugInfo?.status || ch.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {ch.status === 'VERIFIED' ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>VERIFIED</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold">
                        NEUTRAL NO_LOGO
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Audit guarantee: Flash TV displays Flash TV logo, BTN TV displays BTN TV logo.
              </span>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-black text-xs font-black cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
