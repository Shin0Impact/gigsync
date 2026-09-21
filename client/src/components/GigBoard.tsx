import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  X
} from 'lucide-react';
import { IEvent, IUser } from '../shared/types';

interface GigBoardProps {
  events: IEvent[];
  currentUser: IUser;
  onCreateEvent: (eventData: Partial<IEvent>) => void;
  onApplyEvent: (eventId: string, pitch: string, rate: number) => void;
  onViewApplications: () => void;
}

export const GigBoard: React.FC<GigBoardProps> = ({
  events,
  currentUser,
  onCreateEvent,
  onApplyEvent,
  onViewApplications,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [applyingEvent, setApplyingEvent] = useState<IEvent | null>(null);

  // Form states for creating an event
  const [newTitle, setNewTitle] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newDate, setNewDate] = useState('Next Weekend • 8:00 PM');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Music');
  const [newBudget, setNewBudget] = useState('350');

  // Form states for applying
  const [proposalRate, setProposalRate] = useState('350');
  const [proposalPitch, setProposalPitch] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const categories = ['all', 'Music', 'Live Painting', 'Stand-up Comedy', 'DJing', 'Theater / Acting', 'Dance'];

  const filteredEvents = events.filter((e) => {
    if (selectedCategory === 'all') return true;
    return e.categoriesNeeded.some((c) =>
      c.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newVenue.trim()) return;

    onCreateEvent({
      title: newTitle,
      venueName: newVenue,
      eventDate: newDate,
      description: newDescription || 'Seeking talented performer for upcoming showcase.',
      categoriesNeeded: [newCategory],
      budget: Number(newBudget) || 300,
      organizerId: currentUser.id,
      status: 'open',
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewVenue('');
    setNewDescription('');
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingEvent) return;

    onApplyEvent(
      applyingEvent.id,
      proposalPitch || 'I would love to perform for this gig! My equipment and repertoire are prepared.',
      Number(proposalRate) || applyingEvent.budget || 200
    );

    setApplySuccess(true);
    setTimeout(() => {
      setApplySuccess(false);
      setApplyingEvent(null);
      setProposalPitch('');
    }, 1500);
  };

  return (
    <div className="space-y-10">
      {/* Header and Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#1a1a1a]/10 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#1a1a1a]">
              Gig & Casting Board
            </h1>
            <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 border border-[#1a1a1a]/20 text-[#1a1a1a]/70">
              {events.length} Open Calls
            </span>
          </div>
          <p className="text-sm text-[#1a1a1a]/70 mt-2 max-w-xl font-sans leading-relaxed">
            Browse verified stage opportunities posted by local venues, cultural institutions, and creative festival producers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="view-applications-btn"
            onClick={onViewApplications}
            className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold text-[#1a1a1a] border border-[#1a1a1a]/30 hover:border-[#1a1a1a] bg-white transition-colors cursor-pointer"
          >
            Review Bookings
          </button>

          <button
            id="open-post-gig-modal"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold text-white bg-[#1a1a1a] hover:bg-[#5c62d6] transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post a Gig Call</span>
          </button>
        </div>
      </div>

      {/* Category Filter Links */}
      <div className="flex items-center gap-6 overflow-x-auto pb-2 border-b border-[#1a1a1a]/8 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`bg-transparent border-none text-[0.85rem] cursor-pointer transition-opacity whitespace-nowrap py-1 ${
                isActive
                  ? 'text-[#1a1a1a] opacity-100 font-semibold underline underline-offset-8 decoration-2 decoration-[#1a1a1a]'
                  : 'text-[#1a1a1a] opacity-50 hover:opacity-100 font-medium'
              }`}
            >
              {cat === 'all' ? 'All Disciplines' : cat}
            </button>
          );
        })}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-white border border-[#1a1a1a]/15 p-6 sm:p-7 flex flex-col justify-between space-y-5 transition-shadow hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-serif text-2xl sm:text-[1.65rem] font-semibold text-[#1a1a1a] leading-tight">
                  {evt.title}
                </h3>
                {evt.budget && (
                  <span className="font-mono text-sm font-semibold text-[#5c62d6] shrink-0 border border-[#5c62d6]/30 px-2.5 py-0.5">
                    ${evt.budget}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#1a1a1a]/60">
                <span className="text-[#1a1a1a] font-medium">
                  {evt.venueName}
                </span>
                <span>•</span>
                <span>
                  {evt.eventDate}
                </span>
              </div>

              <p className="text-sm text-[#1a1a1a]/70 leading-relaxed font-sans line-clamp-3">
                {evt.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#1a1a1a]/8 flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {evt.categoriesNeeded.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 text-[0.7rem] font-mono uppercase tracking-wider bg-[#1a1a1a]/5 text-[#1a1a1a]"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <button
                id={`apply-gig-${evt.id}`}
                onClick={() => {
                  setApplyingEvent(evt);
                  setProposalRate(String(evt.budget || 250));
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold text-white bg-[#1a1a1a] hover:bg-[#5c62d6] transition-colors cursor-pointer"
              >
                <span>Submit Pitch</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Post Gig Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a1a]/60 backdrop-blur-xs">
          <div className="bg-[#f2efeb] text-[#1a1a1a] border border-[#1a1a1a]/20 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-4">
              <div>
                <span className="text-[0.7rem] font-mono uppercase tracking-widest text-[#1a1a1a]/50">
                  Organizer Hub
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1a1a1a]">
                  Post a Gig or Casting Call
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 border border-[#1a1a1a]/20 bg-white hover:bg-slate-100 flex items-center justify-center text-[#1a1a1a] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
                  Gig Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saturday Rooftop Acoustic Residency"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Harbor Terrace Lounge"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
                    Date & Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. This Saturday • 8 PM"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
                    Discipline Needed
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none"
                  >
                    <option value="Music">Music</option>
                    <option value="Live Painting">Visual Art</option>
                    <option value="Stand-up Comedy">Stand-up Comedy</option>
                    <option value="DJing">DJing</option>
                    <option value="Theater / Acting">Theater / Acting</option>
                    <option value="Dance">Dance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
                    Budget / Compensation ($)
                  </label>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
                  Description & Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail set length, audience vibe, gear provided, and load-in expectations..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-mono text-xs uppercase tracking-wider font-semibold text-white bg-[#1a1a1a] hover:bg-[#5c62d6] transition-colors"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply for Gig Modal */}
      {applyingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a1a]/60 backdrop-blur-xs">
          <div className="bg-[#f2efeb] text-[#1a1a1a] border border-[#1a1a1a]/20 max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-3">
              <div>
                <span className="text-[0.7rem] font-mono uppercase tracking-widest text-[#5c62d6]">
                  Artist Proposal
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1a1a1a] truncate">
                  {applyingEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setApplyingEvent(null)}
                className="w-8 h-8 border border-[#1a1a1a]/20 bg-white hover:bg-slate-100 flex items-center justify-center text-[#1a1a1a] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {applySuccess ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 border border-[#5c62d6] text-[#5c62d6] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-2xl font-semibold text-[#1a1a1a]">Proposal Submitted</h4>
                <p className="text-xs font-sans text-[#1a1a1a]/70">
                  The organizer has received your pitch and portfolio credentials.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
                    Proposed Rate ($ for set)
                  </label>
                  <input
                    type="number"
                    required
                    value={proposalRate}
                    onChange={(e) => setProposalRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none"
                  />
                  <p className="text-[11px] font-mono text-[#1a1a1a]/50 mt-1">
                    Venue posted budget: ${applyingEvent.budget || 'Open'}
                  </p>
                </div>

                <div>
                  <label className="block font-mono uppercase tracking-wider text-[0.7rem] text-[#1a1a1a]/70 mb-1.5">
                    Quick Pitch / Technical Readiness
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Briefly state your experience, setup readiness, and why you're a great fit for this date..."
                    value={proposalPitch}
                    onChange={(e) => setProposalPitch(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyingEvent(null)}
                    className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 font-mono text-xs uppercase tracking-wider font-semibold text-white bg-[#1a1a1a] hover:bg-[#5c62d6] transition-colors"
                  >
                    <span>Send Proposal</span>
                    <span>→</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
