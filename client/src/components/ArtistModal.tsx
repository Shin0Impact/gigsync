import React, { useState, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  MessageSquare,
  Volume2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { IArtistProfile } from '../shared/types';

interface ArtistModalProps {
  artist: IArtistProfile | null;
  onClose: () => void;
  onStartChat: (artist: IArtistProfile) => void;
  onBookDirect?: (artist: IArtistProfile) => void;
}

export const ArtistModal: React.FC<ArtistModalProps> = ({
  artist,
  onClose,
  onStartChat,
  onBookDirect,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!artist) return null;

  const audioItem = artist.portfolio?.find((p) => p.type === 'audio');
  const imageItems = artist.portfolio?.filter((p) => p.type === 'image') || [];

  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleBookClick = () => {
    setBookingSuccess(true);
    if (onBookDirect) {
      onBookDirect(artist);
    }
    setTimeout(() => {
      setBookingSuccess(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a1a]/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#f2efeb] text-[#1a1a1a] border border-[#1a1a1a]/20 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header close button */}
        <button
          id="close-artist-modal"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 border border-[#1a1a1a]/20 hover:border-[#1a1a1a] bg-white/80 hover:bg-white text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header & Profile Overview */}
        <div className="p-6 sm:p-8 border-b border-[#1a1a1a]/10 bg-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative shrink-0">
              <img
                src={
                  imageItems[0]?.url ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop'
                }
                alt={artist.name}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover bg-[#e6e2dc] border border-[#1a1a1a]/15"
              />
              {artist.isEmergencyAvailable && (
                <div className="absolute -bottom-2 -right-2 bg-[#5c62d6] text-white text-[9px] font-mono font-semibold uppercase px-2 py-0.5 tracking-wider">
                  Available Today
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-tight">
                  {artist.name}
                </h2>
                <span className="font-mono text-[0.65rem] uppercase tracking-wider px-2 py-0.5 border border-[#1a1a1a]/20 text-[#1a1a1a]/70">
                  Verified Talent
                </span>
              </div>

              {artist.tagline && (
                <p className="text-[#1a1a1a]/70 text-sm font-sans italic">{artist.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#1a1a1a]/60 pt-1">
                <span className="flex items-center gap-1 text-[#1a1a1a] font-semibold">
                  ★ {artist.ratingAvg.toFixed(1)} ({artist.reviewCount} reviews)
                </span>
                <span>
                  {artist.locationName || 'Metro Area'}
                  {artist.distanceKm ? ` · ${artist.distanceKm} km away` : ''}
                </span>
                <span className="text-[#5c62d6] font-semibold">${artist.hourlyRate}/hour</span>
              </div>

              {/* Category Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {artist.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 text-[0.7rem] font-mono uppercase tracking-wider bg-[#1a1a1a]/5 text-[#1a1a1a]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Bio */}
          <div>
            <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-widest text-[#1a1a1a]/50 mb-2">
              Background & Artistic Philosophy
            </h3>
            <p className="text-[#1a1a1a]/80 text-sm leading-relaxed whitespace-pre-line font-sans">
              {artist.bio || 'Curated professional talent available for bookings.'}
            </p>
          </div>

          {/* Interactive Audio Player Showcase */}
          {audioItem && (
            <div className="border border-[#1a1a1a]/15 bg-white p-4">
              <div className="flex items-center justify-between mb-2 font-mono text-[0.7rem] uppercase tracking-widest text-[#1a1a1a]/60">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#5c62d6]" />
                  <span>Audio Performance Sample</span>
                </span>
                <span>MP3 Audio</span>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <button
                  id="play-audio-btn"
                  onClick={handleToggleAudio}
                  className="w-9 h-9 bg-[#1a1a1a] hover:bg-[#5c62d6] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{audioItem.title}</p>
                  <p className="text-xs text-[#1a1a1a]/60 truncate font-mono">
                    {audioItem.description || 'Live rehearsal recording'}
                  </p>
                </div>

                <audio
                  ref={audioRef}
                  src={audioItem.url}
                  onEnded={() => setIsPlaying(false)}
                  preload="metadata"
                />
              </div>
            </div>
          )}

          {/* Portfolio Photos */}
          {imageItems.length > 0 && (
            <div>
              <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-widest text-[#1a1a1a]/50 mb-3">
                Live Performance & Portfolio Archive
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imageItems.map((img) => (
                  <div
                    key={img.id}
                    className="group relative aspect-4/3 overflow-hidden bg-[#e6e2dc] border border-[#1a1a1a]/15"
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-[#1a1a1a]/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                      <span className="text-white text-xs font-mono truncate">{img.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Reviews */}
          {artist.reviews && artist.reviews.length > 0 && (
            <div>
              <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-widest text-[#1a1a1a]/50 mb-3">
                Curator & Organizer Testimonials ({artist.reviews.length})
              </h3>
              <div className="space-y-3">
                {artist.reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 bg-white border border-[#1a1a1a]/10">
                    <div className="flex items-center justify-between mb-1.5 font-mono text-[0.75rem]">
                      <div>
                        <span className="font-semibold text-[#1a1a1a]">{rev.authorName}</span>
                        <span className="text-[#1a1a1a]/50 ml-2">/ {rev.eventName}</span>
                      </div>
                      <div className="text-[#1a1a1a] font-semibold">
                        ★ {rev.rating}.0
                      </div>
                    </div>
                    <p className="text-xs text-[#1a1a1a]/80 italic leading-relaxed">"{rev.comment}"</p>
                    <p className="text-[10px] font-mono text-[#1a1a1a]/40 mt-1">{rev.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Action CTA */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#1a1a1a]/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[0.7rem] font-mono uppercase text-[#1a1a1a]/50">Curated Rate:</span>
            <div className="font-serif text-2xl font-semibold text-[#1a1a1a] leading-tight">
              ${artist.hourlyRate}
              <span className="text-xs font-mono font-normal text-[#1a1a1a]/50"> / hour</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="artist-modal-message-btn"
              onClick={() => onStartChat(artist)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold text-[#1a1a1a] border border-[#1a1a1a]/30 hover:border-[#1a1a1a] bg-white transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Direct Inquire</span>
            </button>

            <button
              id="artist-modal-book-btn"
              onClick={handleBookClick}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                bookingSuccess
                  ? 'bg-[#5c62d6] text-white'
                  : 'bg-[#1a1a1a] hover:bg-[#5c62d6] text-white'
              }`}
            >
              {bookingSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Request Sent</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Request Booking</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
