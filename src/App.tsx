import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HeroBanner } from './components/HeroBanner';
import { ContinueWatchingRow } from './components/ContinueWatchingRow';
import { ContentCarousel } from './components/ContentCarousel';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { VideoPlayer } from './components/VideoPlayer';
import { LiveTVSection } from './components/LiveTVSection';
import { SearchPage } from './components/SearchPage';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AccountPage } from './components/AccountPage';
import { SupportPage } from './components/SupportPage';
import { AdminView } from './components/views/AdminView';
import { AdminDashboard } from './components/AdminDashboard';
import { OwnerTreasuryPage } from './components/OwnerTreasuryPage';
import { DownloadsPage } from './components/DownloadsPage';
import { LanguageModal } from './components/LanguageModal';
import { GetAppBanner } from './components/GetAppBanner';
import { InstallAppModal } from './components/InstallAppModal';
import { AppSplashScreen } from './components/AppSplashScreen';
import {
  Flame,
  Sparkles,
  Volume2,
  Tv,
  Film,
  Globe2,
  Smile,
  Skull
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeNavTab,
    categoryFilter,
    movies,
    t
  } = useApp();

  // Filter content based on sticky top category tabs
  const displayMovies = movies.filter((item) => {
    if (categoryFilter === 'movies') return item.type === 'movie';
    if (categoryFilter === 'series') return item.type === 'series';
    return true;
  });

  const featuredMovie = movies.find((m) => m.isFeatured) || movies[0];

  // Specific Curated Sections
  const trendingNow = displayMovies.filter((m) => m.isTrending);
  const newReleases = displayMovies.filter((m) => m.isNewRelease);
  const agasobanuyeHits = displayMovies.filter((m) => m.interpreter);
  const africanAndRwanda = displayMovies.filter(
    (m) => m.genres.includes('African Movies') || (m.country && m.country.includes('Rwanda'))
  );
  const seriesOnly = movies.filter((m) => m.type === 'series');
  const actionMovies = displayMovies.filter((m) => m.genres.includes('Action'));
  const koreanAndAsian = displayMovies.filter((m) => m.genres.includes('Korean Drama'));
  const comedies = displayMovies.filter((m) => m.genres.includes('Comedy'));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-green-500 selection:text-black">
      {/* Native App Cold Start Splash Screen */}
      <AppSplashScreen />

      {/* PWA "Get App" Top Banner */}
      <GetAppBanner />

      {/* Sticky Top Header with Top Tabs */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-24 sm:pb-28">
        {/* TAB: Home */}
        {activeNavTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* Featured Hero Banner (Only on "All" or "Movies" view) */}
            {categoryFilter !== 'series' && featuredMovie && (
              <HeroBanner media={featuredMovie} />
            )}

            {/* Continue Watching Section */}
            <ContinueWatchingRow />

            {/* Agasobanuye Hits (Rwandan Interpreter Specials) */}
            {agasobanuyeHits.length > 0 && (
              <ContentCarousel
                title={t('agasobanuyeSection')}
                items={agasobanuyeHits}
                icon={<Volume2 className="w-5 h-5 text-green-400" />}
                subtitle="Rocky Kimomo, Junior Giti, Sankara, Yanga"
              />
            )}

            {/* Trending Now */}
            {trendingNow.length > 0 && (
              <ContentCarousel
                title={t('trendingNow')}
                items={trendingNow}
                icon={<Flame className="w-5 h-5 text-amber-500" />}
              />
            )}

            {/* New Releases */}
            {newReleases.length > 0 && (
              <ContentCarousel
                title={t('newReleases')}
                items={newReleases}
                icon={<Sparkles className="w-5 h-5 text-green-400" />}
              />
            )}

            {/* African Cinema & Rwanda Section */}
            {africanAndRwanda.length > 0 && (
              <ContentCarousel
                title={t('africanCinema')}
                items={africanAndRwanda}
                icon={<Globe2 className="w-5 h-5 text-yellow-500" />}
              />
            )}

            {/* Top TV Series */}
            {categoryFilter !== 'movies' && seriesOnly.length > 0 && (
              <ContentCarousel
                title={t('popularSeries')}
                items={seriesOnly}
                icon={<Film className="w-5 h-5 text-purple-400" />}
              />
            )}

            {/* Action & Thrillers */}
            {actionMovies.length > 0 && (
              <ContentCarousel
                title={t('actionMovies')}
                items={actionMovies}
                icon={<Flame className="w-5 h-5 text-red-500" />}
              />
            )}

            {/* Korean Drama */}
            {koreanAndAsian.length > 0 && (
              <ContentCarousel
                title={t('koreanDramas')}
                items={koreanAndAsian}
                icon={<Sparkles className="w-5 h-5 text-pink-400" />}
              />
            )}

            {/* Comedy Hits */}
            {comedies.length > 0 && (
              <ContentCarousel
                title={t('comedyHits')}
                items={comedies}
                icon={<Smile className="w-5 h-5 text-amber-400" />}
              />
            )}
          </div>
        )}

        {/* TAB: Live TV */}
        {activeNavTab === 'livetv' && <LiveTVSection />}

        {/* TAB: Search */}
        {activeNavTab === 'search' && <SearchPage />}

        {/* TAB: Support */}
        {activeNavTab === 'support' && <SupportPage />}

        {/* TAB: Account */}
        {activeNavTab === 'account' && <AccountPage />}

        {/* TAB: Admin Studio (Protected by AdminView gate) */}
        {activeNavTab === 'admin' && <AdminView />}

        {/* TAB: Owner Treasury & Payouts Portal */}
        {activeNavTab === 'treasury' && <OwnerTreasuryPage />}

        {/* TAB: Downloads */}
        {activeNavTab === 'downloads' && <DownloadsPage />}
      </main>

      {/* Global Modals & Overlays */}
      <LanguageModal />
      <MovieDetailsModal />
      <VideoPlayer />
      <SubscriptionModal />
      <InstallAppModal />

      {/* Sticky 4-Tab Bottom Navigation (Ahabanza, Shakisha, Ubufasha, Konte) */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthProvider>
  );
}
