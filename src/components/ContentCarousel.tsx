import React, { useRef } from 'react';
import { MediaItem } from '../types';
import { ContentCard } from './ContentCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContentCarouselProps {
  title: string;
  items: MediaItem[];
  icon?: React.ReactNode;
  subtitle?: string;
}

export const ContentCarousel: React.FC<ContentCarouselProps> = ({
  title,
  items,
  icon,
  subtitle
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-8 relative group/carousel">
      {/* Category Header */}
      <div className="flex items-end justify-between mb-3.5 px-1">
        <div>
          <div className="flex items-center space-x-2">
            {icon}
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Desktop Carousel Controls */}
        <div className="hidden sm:flex items-center space-x-1.5 opacity-80 group-hover/carousel:opacity-100 transition-opacity">
          <button
            onClick={() => handleScroll('left')}
            className="w-7 h-7 rounded-xl border border-zinc-800 bg-[#111111] hover:border-zinc-600 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-7 h-7 rounded-xl border border-zinc-800 bg-[#111111] hover:border-zinc-600 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal List */}
      <div
        ref={scrollRef}
        className="flex items-center space-x-3.5 sm:space-x-4 overflow-x-auto no-scrollbar py-1 scroll-smooth"
      >
        {items.map((item) => (
          <ContentCard key={item.id} media={item} />
        ))}
      </div>
    </section>
  );
};
