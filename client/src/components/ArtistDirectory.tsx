import React, { useState, useMemo } from 'react';
import { IArtistProfile } from '../shared/types';

interface ArtistDirectoryProps {
  artists: IArtistProfile[];
  onSelectArtist: (artist: IArtistProfile) => void;
  onStartChat: (artist: IArtistProfile) => void;
  emergencyFilterActive: boolean;
  onToggleEmergencyFilter: () => void;
}

const DISCIPLINES = [
  { id: 'all', label: 'All' },
  { id: 'Music', label: 'Music' },
  { id: 'Live Painting', label: 'Visual Art' },
  { id: 'Performance', label: 'Performance' },
  { id: 'Comedy', label: 'Comedy' },
  { id: 'DJing', label: 'DJing' },
  { id: 'Theater', label: 'Theater' },
];

export const ArtistDirectory: React.FC<ArtistDirectoryProps> = ({
  artists,
  onSelectArtist,
  onStartChat,
  emergencyFilterActive,
  onToggleEmergencyFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [maxRadius, setMaxRadius] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'rate'>('distance');

  const filteredArtists = useMemo(() => {
    return artists
      .filter((artist) => {
        // Emergency availability filter
        if (emergencyFilterActive && !artist.isEmergencyAvailable) {
          return false;
        }

        // Category / Discipline filter
        if (selectedDiscipline !== 'all') {
          const match = artist.categories.some((c) =>
            c.toLowerCase().includes(selectedDiscipline.toLowerCase())
          );
          if (!match) return false;
        }

        // Radius filter
        if (maxRadius !== null && (artist.distanceKm ?? 999) > maxRadius) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = artist.name.toLowerCase().includes(q);
          const matchBio = artist.bio?.toLowerCase().includes(q);
          const matchTagline = artist.tagline?.toLowerCase().includes(q);
          const matchCat = artist.categories.some((c) => c.toLowerCase().includes(q));
          if (!matchName && !matchBio && !matchTagline && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
        }
        if (sortBy === 'rating') {
          return b.ratingAvg - a.ratingAvg;
        }
        if (sortBy === 'rate') {
          return (a.hourlyRate ?? 0) - (b.hourlyRate ?? 0);
        }
        return 0;
      });
  }, [artists, emergencyFilterActive, selectedDiscipline, maxRadius, searchQuery, sortBy]);

  return (
    <div>
      {/* Variation 3 Layout Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 sm:mb-14 border-b border-[#1a1a1a]/10 pb-8 gap-6">
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-[4.25rem] font-semibold leading-[1.05] tracking-[-0.02em] text-[#1a1a1a] max-w-[650px]">
          Discovery curated for the modern stage.
        </h1>
        <div className="max-w-[300px] text-[0.85rem] leading-[1.6] text-[#1a1a1a]/70">
          Directly connect with vetted musicians, visual artists, and performers.
          <div
            id="emergency-toggle-hero"
            onClick={onToggleEmergencyFilter}
            className="mt-4 text-[#5c62d6] font-semibold cursor-pointer select-none hover:underline flex items-center gap-1.5 transition-all"
          >
            {emergencyFilterActive ? '← Show All Performers' : 'View Available Today →'}
          </div>
        </div>
      </div>

      {/* Variation 3 Filters Bar */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-10 sm:mb-12 gap-6">
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {DISCIPLINES.map((item) => {
            const isActive = selectedDiscipline === item.id;
            return (
              <button
                key={item.id}
                id={`cat-pill-${item.id}`}
                onClick={() => setSelectedDiscipline(item.id)}
                className={`bg-transparent border-none text-[0.85rem] cursor-pointer transition-opacity whitespace-nowrap py-1 ${
                  isActive
                    ? 'text-[#1a1a1a] opacity-100 font-semibold underline underline-offset-8 decoration-2 decoration-[#1a1a1a]'
                    : 'text-[#1a1a1a] opacity-50 hover:opacity-100 font-medium'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Radius selector */}
          <div className="flex items-center gap-1.5 text-[0.75rem] font-mono text-[#1a1a1a]/60">
            <span>Radius:</span>
            {[
              { label: 'All', val: null },
              { label: '5km', val: 5 },
              { label: '10km', val: 10 },
              { label: '25km', val: 25 },
            ].map((r) => (
              <button
                key={String(r.val)}
                onClick={() => setMaxRadius(r.val)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  maxRadius === r.val
                    ? 'bg-[#1a1a1a] text-white font-medium'
                    : 'hover:text-[#1a1a1a]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 text-[0.75rem] font-mono text-[#1a1a1a]/60">
            <span>Sort:</span>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-b border-[#1a1a1a]/30 text-[0.75rem] font-mono text-[#1a1a1a] outline-none cursor-pointer py-0.5"
            >
              <option value="distance">Proximity</option>
              <option value="rating">Top Rated</option>
              <option value="rate">Rate (Lowest)</option>
            </select>
          </div>

          {/* Search input */}
          <input
            id="artist-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by discipline or keyword..."
            className="border-b border-[#1a1a1a] bg-transparent py-1.5 px-0 font-sans text-[0.85rem] w-full sm:w-[250px] outline-none placeholder-[#1a1a1a]/40 text-[#1a1a1a]"
          />
        </div>
      </div>

      {/* Artists Cards Grid */}
      {filteredArtists.length === 0 ? (
        <div className="bg-[#ffffff]/60 border border-[#1a1a1a]/10 p-12 text-center max-w-md mx-auto my-12 space-y-4">
          <p className="font-serif text-2xl text-[#1a1a1a]">No performers found</p>
          <p className="text-[0.85rem] text-[#1a1a1a]/60 leading-relaxed">
            Try adjusting your search criteria, radius limits, or discipline filter.
          </p>
          <button
            onClick={() => {
              setSelectedDiscipline('all');
              setMaxRadius(null);
              setSearchQuery('');
              if (emergencyFilterActive) onToggleEmergencyFilter();
            }}
            className="text-[0.75rem] font-mono uppercase tracking-wider text-[#5c62d6] font-semibold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 sm:gap-x-10 gap-y-12 sm:gap-y-16">
          {filteredArtists.map((artist) => {
            const firstImg =
              artist.portfolio?.find((p) => p.type === 'image')?.url ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=1000&fit=crop';

            return (
              <div
                key={artist.id}
                id={`artist-card-${artist.id}`}
                onClick={() => onSelectArtist(artist)}
                className="flex flex-col group cursor-pointer select-none"
              >
                {/* Image Wrap */}
                <div className="relative aspect-[4/5] overflow-hidden bg-[#e6e2dc] mb-4">
                  <img
                    src={firstImg}
                    alt={artist.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
                  />

                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 bg-[#1a1a1a]/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[0.7rem] font-mono flex items-center gap-1 shadow-xs">
                    <span>★</span>
                    <span>{artist.ratingAvg.toFixed(1)}</span>
                  </div>

                  {/* Emergency Availability Tag */}
                  {artist.isEmergencyAvailable && (
                    <div className="absolute bottom-0 left-0 right-0 bg-[#5c62d6] text-white py-2 px-3 text-[0.7rem] font-semibold text-center uppercase tracking-[0.1em] shadow-xs">
                      Available Today
                    </div>
                  )}
                </div>

                {/* Card Meta */}
                <div className="flex justify-between items-center font-mono text-[0.75rem] text-[#1a1a1a]/60 mb-2">
                  <span>
                    {artist.categories[0] || 'Performer'} /{' '}
                    {artist.distanceKm ? `${artist.distanceKm}km` : 'Metro'}
                  </span>
                  <span>${artist.hourlyRate}/hr</span>
                </div>

                {/* Card Title */}
                <h2 className="font-serif text-2xl sm:text-[1.75rem] font-semibold text-[#1a1a1a] mb-2 leading-snug group-hover:text-[#5c62d6] transition-colors">
                  {artist.name}
                </h2>

                {/* Card Description */}
                <p className="text-[0.85rem] leading-[1.5] text-[#1a1a1a]/70 mb-4 line-clamp-2">
                  {artist.bio || artist.tagline || 'Curated stage talent available for live bookings.'}
                </p>

                {/* Card Footer Link and Action */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1a1a1a]/6">
                  <div className="text-[0.75rem] font-semibold uppercase tracking-[0.05em] flex items-center gap-2 text-[#1a1a1a] group-hover:text-[#5c62d6] transition-colors">
                    <span>View Portfolio</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>

                  <button
                    id={`message-artist-${artist.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartChat(artist);
                    }}
                    className="text-[0.7rem] font-mono uppercase tracking-wider text-[#1a1a1a]/50 hover:text-[#5c62d6] transition-colors py-1 px-2"
                  >
                    Inquire
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
