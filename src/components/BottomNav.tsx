import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Search, HelpCircle, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeNavTab, setActiveNavTab, t } = useApp();

  const navItems: Array<{
    id: 'home' | 'search' | 'support' | 'account';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'search', label: t('navSearch'), icon: Search },
    { id: 'support', label: t('navSupport'), icon: HelpCircle },
    { id: 'account', label: t('navAccount'), icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-t border-zinc-900 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 items-center px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNavTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveNavTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
                isActive ? 'text-green-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
              </div>
              <span className={`text-[11px] mt-1 font-medium tracking-tight ${isActive ? 'font-bold text-green-400' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
