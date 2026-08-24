import React, { useState, useEffect } from 'react';
import { Tv } from 'lucide-react';
import { LiveChannel } from '../types';
import { getChannelInitials } from '../utils/iptvValidator';

interface ChannelLogoProps {
  channel?: LiveChannel;
  channelId?: string;
  logoUrl?: string | null;
  channelName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallbackText?: boolean;
}

export const ChannelLogo: React.FC<ChannelLogoProps> = ({
  channel,
  channelId: propChannelId,
  logoUrl: propLogoUrl,
  channelName: propChannelName,
  size = 'md',
  className = '',
  showFallbackText = false
}) => {
  const id = channel?.id || propChannelId || 'unknown-channel';
  const name = channel?.name || propChannelName || 'Channel';
  
  // Resolve target logo URL with strict validation (never empty string)
  const candidateUrl =
    propLogoUrl ??
    channel?.logoUrl ??
    (channel?.logo && channel.logo.trim() !== '' && !channel.logo.includes('unsplash.com')
      ? channel.logo
      : null);

  const targetLogoUrl = candidateUrl && typeof candidateUrl === 'string' && candidateUrl.trim().length > 0
    ? candidateUrl.trim()
    : null;

  // Keyed state strictly bound to channel identity to prevent stale logo reuse
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [id, targetLogoUrl]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-12 h-12 text-xs',
    lg: 'w-16 h-16 text-sm',
    xl: 'w-20 h-20 text-base'
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9'
  }[size];

  const initials = getChannelInitials(name);

  // Neutral placeholder component
  const NeutralPlaceholder = (
    <div
      className={`relative w-full h-full rounded-xl bg-gradient-to-br from-zinc-900 via-[#161616] to-zinc-950 border border-zinc-800 flex flex-col items-center justify-center p-1.5 select-none overflow-hidden ${className}`}
      title={`${name} (No Verified Logo)`}
    >
      <div className="flex items-center justify-center space-x-1 text-zinc-400">
        <Tv className={`${iconSizes} text-zinc-500`} />
      </div>
      <span className="font-mono font-black text-zinc-300 tracking-wider truncate max-w-full text-center px-0.5 mt-0.5">
        {initials}
      </span>
      {showFallbackText && (
        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
          LIVE TV
        </span>
      )}
    </div>
  );

  if (!targetLogoUrl || imageFailed) {
    return <div className={`${sizeClasses} flex-shrink-0`}>{NeutralPlaceholder}</div>;
  }

  return (
    <div className={`relative ${sizeClasses} rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-zinc-900/90 border border-zinc-800 p-1 ${className}`}>
      {/* Loading state skeleton / neutral placeholder */}
      {!imageLoaded && (
        <div className="absolute inset-0 z-0">{NeutralPlaceholder}</div>
      )}

      {/* Target Logo image with strict channel ID isolation */}
      <img
        key={`${id}-${targetLogoUrl}`}
        src={targetLogoUrl}
        alt={name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => {
          setImageLoaded(true);
          setImageFailed(false);
        }}
        onError={() => {
          setImageFailed(true);
          setImageLoaded(false);
        }}
        className={`w-full h-full object-contain transition-opacity duration-200 z-10 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

