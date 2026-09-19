import React, { useState } from 'react';
import {
  Zap,
  Plus,
  CheckCircle2,
  Volume2,
  Image
} from 'lucide-react';
import { IArtistProfile, IUser } from '../types';

interface ProfileViewProps {
  currentUser: IUser;
  artistProfile: IArtistProfile | null;
  onToggleEmergency: () => void;
  onUpdateProfile: (updated: Partial<IArtistProfile>) => void;
  onAddPortfolioItem?: (item: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  artistProfile,
  onToggleEmergency,
  onUpdateProfile,
  onAddPortfolioItem,
}) => {
  const [bio, setBio] = useState(
    artistProfile?.bio ||
      'Touring indie-folk guitarist and singer with 8+ years of live performance experience across festivals, rooftop lounges, and intimate private soirees.'
  );
  const [hourlyRate, setHourlyRate] = useState(String(artistProfile?.hourlyRate || 150));
  const [tagline, setTagline] = useState(
    artistProfile?.tagline || 'Fingerstyle Acoustic & Soulful Indie Vocals'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New media modal/input state
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaType, setMediaType] = useState<'audio' | 'image'>('audio');
  const [mediaUrl, setMediaUrl] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      bio,
      tagline,
      hourlyRate: Number(hourlyRate) || 150,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddMediaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim()) return;

    const newItem = {
      id: `port-${Date.now()}`,
      type: mediaType,
      title: mediaTitle,
      url:
        mediaUrl.trim() ||
        (mediaType === 'audio'
          ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
          : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop'),
      description: 'Uploaded live showcase sample',
    };

    if (onAddPortfolioItem) {
      onAddPortfolioItem(newItem);
    }

    setShowAddMedia(false);
    setMediaTitle('');
    setMediaUrl('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Availability Status Card */}
      <div className="bg-white border border-[#1a1a1a]/15 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
              <span className="text-[#5c62d6] font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Emergency Availability
              </span>
              <span className="text-[#1a1a1a]/40">· Instant Same-Day Booking</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-tight">
              Same-Day Stage Availability
            </h2>
            <p className="text-sm text-[#1a1a1a]/70 max-w-xl leading-relaxed font-sans">
              When toggled ON, nearby event organizers seeking urgent replacements or last-minute performers will see your profile highlighted at the top of the directory.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
            <button
              id="emergency-status-toggle"
              onClick={onToggleEmergency}
              className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                artistProfile?.isEmergencyAvailable
                  ? 'bg-[#5c62d6] text-white shadow-xs'
                  : 'bg-white text-[#1a1a1a] border border-[#1a1a1a]/30 hover:border-[#1a1a1a]'
              }`}
            >
              <Zap
                className={`w-3.5 h-3.5 ${
                  artistProfile?.isEmergencyAvailable ? 'text-white' : 'text-[#5c62d6]'
                }`}
              />
              <span>
                {artistProfile?.isEmergencyAvailable ? 'Status: Available Today (Active)' : 'Turn ON Availability'}
              </span>
            </button>
            <span className="font-mono text-[10px] text-[#1a1a1a]/50">
              {artistProfile?.isEmergencyAvailable
                ? 'Broadcasting to regional curators'
                : 'Standby mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white border border-[#1a1a1a]/15 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-[#1a1a1a]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=face'
              }
              alt={currentUser.name}
              className="w-16 h-16 object-cover border border-[#1a1a1a]/15 bg-[#e6e2dc]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-3xl font-semibold text-[#1a1a1a]">{currentUser.name}</h3>
                <span className="px-2 py-0.5 text-[0.65rem] font-mono uppercase tracking-wider border border-[#1a1a1a]/20 text-[#1a1a1a]/70">
                  Verified
                </span>
              </div>
              <p className="font-mono text-xs text-[#1a1a1a]/50 mt-0.5">
                {currentUser.email} · <span className="uppercase text-[#5c62d6]">{currentUser.role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs border border-[#1a1a1a]/10 p-3 bg-[#f2efeb]/40">
            <div className="text-center px-2">
              <span className="block font-semibold text-[#1a1a1a] text-sm">
                ★ {artistProfile?.ratingAvg?.toFixed(1) || '4.9'}
              </span>
              <span className="text-[10px] text-[#1a1a1a]/50 uppercase">Rating</span>
            </div>
            <div className="h-6 w-px bg-[#1a1a1a]/10" />
            <div className="text-center px-2">
              <span className="block font-semibold text-[#1a1a1a] text-sm">
                {artistProfile?.reviewCount || 28}
              </span>
              <span className="text-[10px] text-[#1a1a1a]/50 uppercase">Reviews</span>
            </div>
            <div className="h-6 w-px bg-[#1a1a1a]/10" />
            <div className="text-center px-2">
              <span className="block font-semibold text-[#5c62d6] text-sm">
                ${artistProfile?.hourlyRate || 150}
              </span>
              <span className="text-[10px] text-[#1a1a1a]/50 uppercase">Hourly</span>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5 text-xs font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
                Artistic Style Summary
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none text-sm"
              />
            </div>

            <div>
              <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
                Standard Hourly Booking Rate ($)
              </label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
              Artist Biography & Provenance
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none leading-relaxed text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            {savedSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-[#5c62d6] font-mono text-xs uppercase tracking-wider font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Profile updated successfully!
              </span>
            ) : <span />}

            <button
              type="submit"
              id="save-profile-btn"
              className="px-6 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold text-white bg-[#1a1a1a] hover:bg-[#5c62d6] transition-colors cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Media Portfolio Showcase */}
      <div className="bg-white border border-[#1a1a1a]/15 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1a1a1a]">
              Portfolio Media Archive
            </h3>
            <p className="text-xs font-sans text-[#1a1a1a]/60 mt-1">
              Audio samples and performance photography preserved in cloud object storage.
            </p>
          </div>

          <button
            id="add-media-item-btn"
            onClick={() => setShowAddMedia(true)}
            className="flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold text-[#1a1a1a] border border-[#1a1a1a]/30 hover:border-[#1a1a1a] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Media Item</span>
          </button>
        </div>

        {/* Existing Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {artistProfile?.portfolio?.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white border border-[#1a1a1a]/15 flex items-center gap-3"
            >
              <div className="w-10 h-10 border border-[#1a1a1a]/15 text-[#1a1a1a] flex items-center justify-center shrink-0 bg-[#f2efeb]">
                {item.type === 'audio' ? <Volume2 className="w-4 h-4 text-[#5c62d6]" /> : <Image className="w-4 h-4 text-[#1a1a1a]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#1a1a1a] truncate font-sans">{item.title}</p>
                <p className="text-[10px] font-mono text-[#1a1a1a]/50 uppercase">{item.type} archive</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Media Modal */}
        {showAddMedia && (
          <form
            onSubmit={handleAddMediaSubmit}
            className="p-5 bg-[#f2efeb]/50 border border-[#1a1a1a]/15 space-y-4 text-xs font-sans"
          >
            <h4 className="font-serif text-xl font-semibold text-[#1a1a1a]">Add Portfolio Asset</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Mainstage Solo"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none"
                />
              </div>

              <div>
                <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1">
                  Asset Type
                </label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none"
                >
                  <option value="audio">Audio Sample (MP3)</option>
                  <option value="image">Performance Photo</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMedia(false)}
                className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-mono text-xs uppercase tracking-wider font-semibold text-white bg-[#1a1a1a] hover:bg-[#5c62d6] transition-colors cursor-pointer"
              >
                Add Asset
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
