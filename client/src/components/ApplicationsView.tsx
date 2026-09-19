import React from 'react';
import { Check, X, Clock, MessageSquare, Briefcase } from 'lucide-react';
import { IApplication, IUser } from '../types';

interface ApplicationsViewProps {
  applications: IApplication[];
  currentUser: IUser;
  onUpdateStatus: (appId: string, status: 'accepted' | 'rejected') => void;
  onStartChatWithArtist: (artistId: string, artistName: string) => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  applications,
  currentUser,
  onUpdateStatus,
  onStartChatWithArtist,
}) => {
  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#1a1a1a]/10 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#1a1a1a]">
              Applications & Bookings Hub
            </h1>
            <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 border border-[#1a1a1a]/20 text-[#1a1a1a]/70">
              {applications.length} Records
            </span>
          </div>
          <p className="text-sm text-[#1a1a1a]/70 mt-2 max-w-xl font-sans leading-relaxed">
            Review performer submissions, confirm engagement terms, and coordinate performance logistics.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1 bg-white border border-[#1a1a1a]/15 text-[#1a1a1a]">
            {applications.filter((a) => a.status === 'accepted').length} Confirmed
          </span>
          <span className="px-3 py-1 bg-white border border-[#1a1a1a]/15 text-[#5c62d6]">
            {applications.filter((a) => a.status === 'pending').length} In Review
          </span>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white p-16 text-center border border-[#1a1a1a]/15 space-y-3">
          <Briefcase className="w-8 h-8 text-[#1a1a1a]/30 mx-auto" />
          <h3 className="font-serif text-2xl font-semibold text-[#1a1a1a]">No applications on record</h3>
          <p className="text-xs font-sans text-[#1a1a1a]/60 max-w-sm mx-auto">
            Browse the Gig Board to submit proposals for open casting calls, or publish a new casting call to receive artist submissions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isAccepted = app.status === 'accepted';
            const isRejected = app.status === 'rejected';

            return (
              <div
                key={app.id}
                className="bg-white p-6 border border-[#1a1a1a]/15 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xs transition-all"
              >
                {/* Performer & Proposal details */}
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={
                      app.artistAvatar ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=face'
                    }
                    alt={app.artistName}
                    className="w-14 h-14 object-cover border border-[#1a1a1a]/15 shrink-0 bg-[#e6e2dc]"
                  />

                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-2xl font-semibold text-[#1a1a1a]">{app.artistName}</h3>
                      <span className="px-2 py-0.5 text-[0.7rem] font-mono uppercase tracking-wider bg-[#1a1a1a]/5 text-[#1a1a1a]">
                        {app.category}
                      </span>
                      <span className="font-mono text-xs text-[#1a1a1a]/40">· {app.createdAt}</span>
                    </div>

                    <p className="text-sm text-[#1a1a1a]/80 font-sans italic border-l-2 border-[#1a1a1a]/20 pl-3.5 py-0.5">
                      "{app.pitch}"
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                      <span className="text-[#1a1a1a]/70">
                        Proposed Compensation:{' '}
                        <strong className="text-[#5c62d6] font-semibold font-mono">${app.rateProposed}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <div className="mr-1">
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider border border-[#5c62d6]/30 bg-[#5c62d6]/5 text-[#5c62d6]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Accepted</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider border border-[#1a1a1a]/20 text-[#1a1a1a]/50">
                        <X className="w-3.5 h-3.5" />
                        <span>Declined</span>
                      </span>
                    )}
                    {!isAccepted && !isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider border border-[#1a1a1a]/30 text-[#1a1a1a]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  {currentUser.role === 'organizer' && !isAccepted && !isRejected && (
                    <>
                      <button
                        id={`accept-app-${app.id}`}
                        onClick={() => onUpdateStatus(app.id, 'accepted')}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold text-white bg-[#1a1a1a] hover:bg-[#5c62d6] transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>

                      <button
                        id={`reject-app-${app.id}`}
                        onClick={() => onUpdateStatus(app.id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider font-semibold text-[#1a1a1a] border border-[#1a1a1a]/30 hover:border-[#1a1a1a] transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  )}

                  <button
                    id={`chat-app-${app.id}`}
                    onClick={() => onStartChatWithArtist(app.artistId, app.artistName)}
                    className="p-2.5 text-[#1a1a1a] border border-[#1a1a1a]/30 hover:border-[#1a1a1a] transition-colors cursor-pointer"
                    title="Direct Message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
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
