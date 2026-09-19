import React from 'react';
import { IUser, UserRole } from '../types';

interface NavbarProps {
  currentTab: 'artists' | 'gigs' | 'applications' | 'messages' | 'profile';
  onSelectTab: (tab: 'artists' | 'gigs' | 'applications' | 'messages' | 'profile') => void;
  currentUser: IUser;
  onSwitchRole: (role: UserRole) => void;
  emergencyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onSwitchRole,
  emergencyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#f2efeb]/95 backdrop-blur-md border-b border-[#1a1a1a]/8 px-4 sm:px-8 lg:px-14 py-4 sm:py-5 flex items-center justify-between transition-colors">
      {/* Logo */}
      <div
        className="font-serif text-2xl sm:text-3xl font-semibold italic text-[#1a1a1a] cursor-pointer select-none tracking-tight"
        onClick={() => onSelectTab('artists')}
      >
        GigSync.
      </div>

      {/* Nav Links */}
      <nav className="flex items-center gap-5 sm:gap-8 md:gap-10">
        <button
          id="nav-tab-artists"
          onClick={() => onSelectTab('artists')}
          className={`text-[0.75rem] uppercase tracking-[0.1em] font-semibold transition-all cursor-pointer ${
            currentTab === 'artists'
              ? 'opacity-100 underline underline-offset-8 decoration-2 decoration-[#1a1a1a]'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <span>Artists</span>
          {emergencyCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 text-[0.65rem] font-mono rounded bg-[#5c62d6] text-white">
              {emergencyCount}
            </span>
          )}
        </button>

        <button
          id="nav-tab-gigs"
          onClick={() => onSelectTab('gigs')}
          className={`text-[0.75rem] uppercase tracking-[0.1em] font-semibold transition-all cursor-pointer ${
            currentTab === 'gigs'
              ? 'opacity-100 underline underline-offset-8 decoration-2 decoration-[#1a1a1a]'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          Gigs
        </button>

        <button
          id="nav-tab-applications"
          onClick={() => onSelectTab('applications')}
          className={`text-[0.75rem] uppercase tracking-[0.1em] font-semibold transition-all cursor-pointer ${
            currentTab === 'applications'
              ? 'opacity-100 underline underline-offset-8 decoration-2 decoration-[#1a1a1a]'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          Bookings
        </button>

        <button
          id="nav-tab-messages"
          onClick={() => onSelectTab('messages')}
          className={`text-[0.75rem] uppercase tracking-[0.1em] font-semibold transition-all cursor-pointer ${
            currentTab === 'messages'
              ? 'opacity-100 underline underline-offset-8 decoration-2 decoration-[#1a1a1a]'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          Inquire
        </button>
      </nav>

      {/* Right User & Role controls */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Quick Role switch */}
        <div className="hidden md:flex items-center border border-[#1a1a1a]/15 rounded-full p-0.5 text-[0.65rem] font-mono uppercase bg-[#ffffff]/60">
          <button
            id="role-artist-btn"
            onClick={() => onSwitchRole('artist')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              currentUser.role === 'artist'
                ? 'bg-[#1a1a1a] text-white font-medium shadow-xs'
                : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a]'
            }`}
          >
            Artist
          </button>
          <button
            id="role-organizer-btn"
            onClick={() => onSwitchRole('organizer')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              currentUser.role === 'organizer'
                ? 'bg-[#1a1a1a] text-white font-medium shadow-xs'
                : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a]'
            }`}
          >
            Organizer
          </button>
          <button
            id="role-fan-btn"
            onClick={() => onSwitchRole('fan')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              currentUser.role === 'fan'
                ? 'bg-[#1a1a1a] text-white font-medium shadow-xs'
                : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a]'
            }`}
          >
            Fan
          </button>
        </div>

        {/* User profile avatar & trigger */}
        <div
          id="profile-button"
          onClick={() => onSelectTab('profile')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Account & Settings"
        >
          <div className="text-right hidden sm:block">
            <p className="text-[0.8rem] font-semibold text-[#1a1a1a] group-hover:text-[#5c62d6] transition-colors leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[0.65rem] font-mono text-[#1a1a1a]/50 uppercase tracking-wider">
              {currentUser.role} Mode
            </p>
          </div>
          <img
            src={
              currentUser.avatarUrl ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop'
            }
            alt={currentUser.name}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[#1a1a1a]/15 group-hover:border-[#5c62d6] transition-colors shadow-xs"
          />
        </div>
      </div>
    </header>
  );
};
