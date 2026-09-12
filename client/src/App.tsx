import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navbar } from './components/Navbar';
import { ArtistDirectory } from './components/ArtistDirectory';
import { ArtistModal } from './components/ArtistModal';
import { GigBoard } from './components/GigBoard';
import { ApplicationsView } from './components/ApplicationsView';
import { ChatView } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { IArtistProfile, IApplication, IConversation, IEvent, IMessage, IUser, UserRole } from './types';

// Fallback initial data ensuring zero friction even before network responses
const INITIAL_USER: IUser = {
  id: 'user-artist-1',
  email: 'alex@example.com',
  name: 'Alex Rivers',
  role: 'artist',
  avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=face',
  isVerified: true,
};

const INITIAL_ARTISTS: IArtistProfile[] = [
  {
    id: 'artist-1',
    userId: 'user-artist-1',
    name: 'Alex Rivers',
    locationName: 'Downtown / Metro Arts District',
    tagline: 'Fingerstyle Acoustic & Soulful Indie Vocals',
    bio: 'Touring indie-folk guitarist and singer with 8+ years of live performance experience across festivals, rooftop lounges, and intimate private soirees.',
    hourlyRate: 150,
    isEmergencyAvailable: true,
    ratingAvg: 4.9,
    reviewCount: 28,
    categories: ['Music'],
    distanceKm: 2.4,
    portfolio: [
      {
        id: 'port-1',
        type: 'audio',
        title: 'Golden Hour (Live Acoustic Session)',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        description: 'Original acoustic performance recorded live in studio.',
      },
      {
        id: 'port-2',
        type: 'image',
        title: 'Headline at The Mercury Lounge',
        url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop',
      },
      {
        id: 'port-3',
        type: 'image',
        title: 'Festival Sunset Stage',
        url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=600&fit=crop',
      },
    ],
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Maya Lin (Velvet Lounge)',
        eventName: 'Sunset Rooftop Session',
        rating: 5,
        comment: 'Alex arrived early, read the crowd mood effortlessly, and delivered a sublime acoustic set.',
        date: '2026-08-20',
      },
    ],
  },
  {
    id: 'artist-2',
    userId: 'user-artist-2',
    name: 'Sofia Chen',
    locationName: 'North Arts Quarter',
    tagline: 'Live Speed-Painting, Acrylic Murals & Canvas Art',
    bio: 'Contemporary visual artist creating energetic live paintings in real-time during cocktail hours, corporate launches, and art festivals.',
    hourlyRate: 180,
    isEmergencyAvailable: true,
    ratingAvg: 5.0,
    reviewCount: 19,
    categories: ['Live Painting'],
    distanceKm: 4.1,
    portfolio: [
      {
        id: 'port-4',
        type: 'image',
        title: 'Neon Odyssey (Live Canvas)',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&h=600&fit=crop',
      },
    ],
    reviews: [
      {
        id: 'rev-2',
        authorName: 'Apex Gallery',
        eventName: 'Opening Gala',
        rating: 5,
        comment: 'Watching Sofia paint live was the highlight of our gala.',
        date: '2026-08-11',
      },
    ],
  },
  {
    id: 'artist-3',
    userId: 'user-artist-3',
    name: 'Marcus "DJ Drift" Vance',
    locationName: 'South Pier & Warehouse District',
    tagline: 'Deep Organic House, Nu-Disco & Melodic Beats',
    bio: 'Versatile vinyl & digital DJ curating vibrant sonic journeys for upscale clubs, art gatherings, and outdoor sunset terraces.',
    hourlyRate: 160,
    isEmergencyAvailable: false,
    ratingAvg: 4.8,
    reviewCount: 34,
    categories: ['DJing', 'Music'],
    distanceKm: 6.8,
    portfolio: [
      {
        id: 'port-6',
        type: 'audio',
        title: 'Horizon Chill & Groove Mixtape',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        description: 'Selected cuts from recent festival set.',
      },
    ],
  },
  {
    id: 'artist-4',
    userId: 'user-artist-4',
    name: 'Dave K.',
    locationName: 'Midtown Entertainment Strip',
    tagline: 'Stand-Up Comedy & Charismatic Event Host',
    bio: 'High-energy stand-up comic and emcee featured on regional comedy clubs and festivals. Clean corporate or edgy club sets available.',
    hourlyRate: 120,
    isEmergencyAvailable: true,
    ratingAvg: 4.7,
    reviewCount: 15,
    categories: ['Stand-up Comedy', 'Theater / Acting'],
    distanceKm: 1.8,
    portfolio: [
      {
        id: 'port-8',
        type: 'image',
        title: 'Laugh Cellar Headline',
        url: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=600&fit=crop',
      },
    ],
  },
  {
    id: 'artist-5',
    userId: 'user-artist-5',
    name: 'Elena Rostova',
    locationName: 'West Riverside',
    tagline: 'Aerial Silk, Fire Dance & Visual Performance Art',
    bio: 'Trained circus artist specializing in mesmerizing aerial silks, LED flow art, and ambient stage movement.',
    hourlyRate: 220,
    isEmergencyAvailable: false,
    ratingAvg: 4.95,
    reviewCount: 22,
    categories: ['Magic / Performance Art', 'Dance'],
    distanceKm: 9.3,
    portfolio: [
      {
        id: 'port-9',
        type: 'image',
        title: 'Aerial Silk Flow',
        url: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&h=600&fit=crop',
      },
    ],
  },
];

const INITIAL_EVENTS: IEvent[] = [
  {
    id: 'event-1',
    organizerId: 'user-org-1',
    title: 'Sunset Acoustic & Wine Pairing Evening',
    description: 'Looking for a skilled fingerstyle acoustic guitarist or indie vocalist to provide warm ambient melodies for our garden terrace.',
    venueName: 'The Velvet Rooftop & Wine Lounge',
    eventDate: 'Tonight • 7:30 PM - 10:30 PM',
    status: 'open',
    categoriesNeeded: ['Music'],
    budget: 450,
  },
  {
    id: 'event-2',
    organizerId: 'user-org-1',
    title: 'Downtown Comedy Club Late Showcase',
    description: 'Urgent replacement needed for a 25-minute stand-up set following an unexpected performer cancellation.',
    venueName: 'The Underground Laugh Cellar',
    eventDate: 'Tomorrow • 9:00 PM',
    status: 'open',
    categoriesNeeded: ['Stand-up Comedy'],
    budget: 250,
  },
  {
    id: 'event-3',
    organizerId: 'user-org-1',
    title: 'Contemporary Gallery Opening Live Canvas',
    description: 'We require a visual artist to execute a vibrant live canvas painting during the 2-hour opening reception.',
    venueName: 'Lumina Contemporary Art Space',
    eventDate: 'This Friday • 6:00 PM - 9:00 PM',
    status: 'open',
    categoriesNeeded: ['Live Painting'],
    budget: 500,
  },
  {
    id: 'event-4',
    organizerId: 'user-org-1',
    title: 'Saturday Neon Skyline Rooftop DJ Session',
    description: 'Seeking a tasteful DJ specializing in Deep Melodic House and Nu-Disco for our weekly Saturday dusk party.',
    venueName: 'Apex 360 Sky Deck',
    eventDate: 'Saturday • 8:00 PM - Midnight',
    status: 'open',
    categoriesNeeded: ['DJing', 'Music'],
    budget: 600,
  },
];

const INITIAL_APPLICATIONS: IApplication[] = [
  {
    id: 'app-1',
    eventId: 'event-1',
    artistId: 'artist-1',
    artistName: 'Alex Rivers',
    artistAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=face',
    category: 'Music',
    rateProposed: 400,
    pitch: 'I have played rooftop venues extensively and my acoustic repertoire fits wine pairings perfectly.',
    status: 'accepted',
    createdAt: '2 hours ago',
  },
  {
    id: 'app-2',
    eventId: 'event-3',
    artistId: 'artist-2',
    artistName: 'Sofia Chen',
    artistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
    category: 'Live Painting',
    rateProposed: 500,
    pitch: 'I specialize in fast, high-contrast acrylic pieces that evolve rhythmically alongside the evening.',
    status: 'pending',
    createdAt: '5 hours ago',
  },
];

const INITIAL_CONVERSATIONS: IConversation[] = [
  {
    id: 'conv-1',
    eventId: 'event-1',
    participantIds: ['user-org-1', 'user-artist-1'],
    updatedAt: new Date().toISOString(),
    partner: {
      id: 'user-artist-1',
      name: 'Alex Rivers',
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=face',
      role: 'Indie Singer/Songwriter',
    },
    lastMessage: 'Sounds fantastic Maya! I will arrive at 6:45 PM for a quick soundcheck.',
  },
  {
    id: 'conv-2',
    eventId: 'event-3',
    participantIds: ['user-org-1', 'user-artist-2'],
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    partner: {
      id: 'user-artist-2',
      name: 'Sofia Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
      role: 'Live Painter',
    },
    lastMessage: 'I can bring my 48x36 heavy canvas. Will there be spotlighting above the easel?',
  },
];

const INITIAL_MESSAGES: Record<string, IMessage[]> = {
  'conv-1': [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-org-1',
      content: 'Hi Alex! We loved your acoustic clips. We would love to have you play the Sunset Lounge tonight from 7:30 PM.',
      isRead: true,
      createdAt: 'Today, 2:15 PM',
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'user-artist-1',
      content: 'Thank you Maya! That sounds like a wonderful crowd. Do you have a direct PA or should I bring my acoustic amplifier?',
      isRead: true,
      createdAt: 'Today, 2:20 PM',
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 'user-org-1',
      content: 'We have stereo XLR inputs and an audio engineer on site. You just need your guitar and voice mic!',
      isRead: true,
      createdAt: 'Today, 2:24 PM',
    },
    {
      id: 'msg-4',
      conversationId: 'conv-1',
      senderId: 'user-artist-1',
      content: 'Sounds fantastic Maya! I will arrive at 6:45 PM for a quick soundcheck.',
      isRead: true,
      createdAt: 'Today, 2:30 PM',
    },
  ],
  'conv-2': [
    {
      id: 'msg-5',
      conversationId: 'conv-2',
      senderId: 'user-artist-2',
      content: 'Hi Maya, I saw the call for Lumina Contemporary Art opening. I would love to perform.',
      isRead: true,
      createdAt: 'Today, 11:00 AM',
    },
    {
      id: 'msg-6',
      conversationId: 'conv-2',
      senderId: 'user-org-1',
      content: 'Your portfolio is stunning Sofia! We have an easel set up in the central atrium.',
      isRead: true,
      createdAt: 'Today, 11:15 AM',
    },
  ],
};

function App() {
  const [currentTab, setCurrentTab] = useState<'artists' | 'gigs' | 'applications' | 'messages' | 'profile'>('artists');
  const [currentUser, setCurrentUser] = useState<IUser>(INITIAL_USER);
  const [artists, setArtists] = useState<IArtistProfile[]>(INITIAL_ARTISTS);
  const [events, setEvents] = useState<IEvent[]>(INITIAL_EVENTS);
  const [applications, setApplications] = useState<IApplication[]>(INITIAL_APPLICATIONS);
  const [conversations, setConversations] = useState<IConversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [allMessages, setAllMessages] = useState<Record<string, IMessage[]>>(INITIAL_MESSAGES);
  const [selectedArtistModal, setSelectedArtistModal] = useState<IArtistProfile | null>(null);
  const [emergencyFilterActive, setEmergencyFilterActive] = useState(false);

  // Sync with API on mount if available
  useEffect(() => {
    axios.get('/api/artists/search')
      .then((res) => {
        if (res.data?.artists && Array.isArray(res.data.artists)) {
          setArtists(res.data.artists);
        }
      })
      .catch(() => {
        // Fallback to initial seed data
      });

    axios.get('/api/events')
      .then((res) => {
        if (res.data?.events && Array.isArray(res.data.events)) {
          setEvents(res.data.events);
        }
      })
      .catch(() => {});

    axios.get('/api/conversations')
      .then((res) => {
        if (res.data?.conversations && Array.isArray(res.data.conversations)) {
          setConversations(res.data.conversations);
        }
      })
      .catch(() => {});
  }, []);

  const emergencyCount = artists.filter((a) => a.isEmergencyAvailable).length;

  const handleSwitchRole = (role: UserRole) => {
    if (role === 'organizer') {
      const orgUser: IUser = {
        id: 'user-org-1',
        email: 'maya@velvetlounge.com',
        name: 'Maya Lin',
        role: 'organizer',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
        isVerified: true,
      };
      setCurrentUser(orgUser);
    } else if (role === 'fan') {
      const fanUser: IUser = {
        id: 'user-fan-1',
        email: 'jordan@example.com',
        name: 'Jordan Taylor',
        role: 'fan',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face',
        isVerified: false,
      };
      setCurrentUser(fanUser);
    } else {
      setCurrentUser(INITIAL_USER);
    }

    axios.post('/api/auth/switch-role', { role }).catch(() => {});
  };

  const handleToggleUserEmergency = () => {
    const updated = !artists[0].isEmergencyAvailable;
    const updatedArtists = [...artists];
    updatedArtists[0] = { ...updatedArtists[0], isEmergencyAvailable: updated };
    setArtists(updatedArtists);

    axios.patch('/api/artists/me/emergency-status', { isEmergencyAvailable: updated }).catch(() => {});
  };

  const handleUpdateProfile = (updatedFields: Partial<IArtistProfile>) => {
    const updatedArtists = [...artists];
    updatedArtists[0] = { ...updatedArtists[0], ...updatedFields };
    setArtists(updatedArtists);
  };

  const handleAddPortfolioItem = (item: any) => {
    const updatedArtists = [...artists];
    const currPort = updatedArtists[0].portfolio || [];
    updatedArtists[0] = { ...updatedArtists[0], portfolio: [...currPort, item] };
    setArtists(updatedArtists);
  };

  const handleCreateEvent = (eventData: Partial<IEvent>) => {
    const newEvt: IEvent = {
      id: `event-${Date.now()}`,
      organizerId: currentUser.id,
      title: eventData.title || 'New Gig',
      description: eventData.description || '',
      venueName: eventData.venueName || 'Local Venue',
      eventDate: eventData.eventDate || 'This Weekend',
      status: 'open',
      categoriesNeeded: eventData.categoriesNeeded || ['Music'],
      budget: eventData.budget || 300,
    };

    setEvents([newEvt, ...events]);
    axios.post('/api/events', newEvt).catch(() => {});
  };

  const handleApplyEvent = (eventId: string, pitch: string, rate: number) => {
    const targetEvent = events.find((e) => e.id === eventId);
    const newApp: IApplication = {
      id: `app-${Date.now()}`,
      eventId,
      artistId: currentUser.id,
      artistName: currentUser.name,
      artistAvatar: currentUser.avatarUrl || undefined,
      category: targetEvent?.categoriesNeeded[0] || 'Music',
      rateProposed: rate,
      pitch,
      status: 'pending',
      createdAt: 'Just now',
    };

    setApplications([newApp, ...applications]);
    axios.post(`/api/events/${eventId}/apply`, newApp).catch(() => {});
  };

  const handleUpdateApplicationStatus = (appId: string, status: 'accepted' | 'rejected') => {
    setApplications(
      applications.map((a) => (a.id === appId ? { ...a, status } : a))
    );
    axios.patch(`/api/events/applications/${appId}`, { status }).catch(() => {});
  };

  const handleStartChat = (artist: IArtistProfile) => {
    let existingConv = conversations.find((c) => c.partner?.id === artist.userId || c.partner?.name === artist.name);

    if (!existingConv) {
      existingConv = {
        id: `conv-${Date.now()}`,
        participantIds: [currentUser.id, artist.userId],
        updatedAt: new Date().toISOString(),
        partner: {
          id: artist.userId,
          name: artist.name,
          avatarUrl: artist.portfolio?.[0]?.url,
          role: artist.categories[0] || 'Performer',
        },
        lastMessage: 'Conversation started',
      };
      setConversations([existingConv, ...conversations]);
      setAllMessages({
        ...allMessages,
        [existingConv.id]: [
          {
            id: `msg-${Date.now()}`,
            conversationId: existingConv.id,
            senderId: currentUser.id,
            content: `Hello ${artist.name}! We'd love to connect regarding upcoming performance slots.`,
            isRead: true,
            createdAt: 'Just now',
          },
        ],
      });
    }

    setActiveConvId(existingConv.id);
    setSelectedArtistModal(null);
    setCurrentTab('messages');
  };

  const handleSendMessage = (conversationId: string, content: string) => {
    const newMsg: IMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      content,
      isRead: true,
      createdAt: 'Just now',
    };

    const updated = {
      ...allMessages,
      [conversationId]: [...(allMessages[conversationId] || []), newMsg],
    };
    setAllMessages(updated);

    // Update conversation snippet
    setConversations(
      conversations.map((c) =>
        c.id === conversationId ? { ...c, lastMessage: content } : c
      )
    );

    // Interactive reply simulation after 1 second for delight
    setTimeout(() => {
      const activeC = conversations.find((c) => c.id === conversationId);
      const replyMsg: IMessage = {
        id: `msg-reply-${Date.now()}`,
        conversationId,
        senderId: activeC?.partner?.id || 'other',
        content: "Thanks for reaching out! I've noted the details and am available for this date.",
        isRead: false,
        createdAt: 'Just now',
      };
      setAllMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), replyMsg],
      }));
    }, 1200);

    axios.post(`/api/conversations/${conversationId}/messages`, { content, senderId: currentUser.id }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#f2efeb] text-[#1a1a1a] flex flex-col antialiased selection:bg-[#5c62d6] selection:text-white">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        emergencyCount={emergencyCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 lg:px-[4vw] py-8 sm:py-12">
        {currentTab === 'artists' && (
          <ArtistDirectory
            artists={artists}
            onSelectArtist={setSelectedArtistModal}
            onStartChat={handleStartChat}
            emergencyFilterActive={emergencyFilterActive}
            onToggleEmergencyFilter={() => setEmergencyFilterActive(!emergencyFilterActive)}
          />
        )}

        {currentTab === 'gigs' && (
          <GigBoard
            events={events}
            currentUser={currentUser}
            onCreateEvent={handleCreateEvent}
            onApplyEvent={handleApplyEvent}
            onViewApplications={() => setCurrentTab('applications')}
          />
        )}

        {currentTab === 'applications' && (
          <ApplicationsView
            applications={applications}
            currentUser={currentUser}
            onUpdateStatus={handleUpdateApplicationStatus}
            onStartChatWithArtist={(artistId, name) => {
              const artist = artists.find((a) => a.id === artistId || a.name === name) || artists[0];
              handleStartChat(artist);
            }}
          />
        )}

        {currentTab === 'messages' && (
          <ChatView
            conversations={conversations}
            activeConversationId={activeConvId}
            onSelectConversation={setActiveConvId}
            messages={allMessages[activeConvId] || []}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            artistProfile={artists[0]}
            onToggleEmergency={handleToggleUserEmergency}
            onUpdateProfile={handleUpdateProfile}
            onAddPortfolioItem={handleAddPortfolioItem}
          />
        )}
      </main>

      {/* Artist Portfolio Modal */}
      {selectedArtistModal && (
        <ArtistModal
          artist={selectedArtistModal}
          onClose={() => setSelectedArtistModal(null)}
          onStartChat={handleStartChat}
          onBookDirect={(artist) => {
            const newApp: IApplication = {
              id: `app-direct-${Date.now()}`,
              eventId: 'direct-booking',
              artistId: artist.id,
              artistName: artist.name,
              artistAvatar: artist.portfolio?.[0]?.url,
              category: artist.categories[0] || 'Performer',
              rateProposed: artist.hourlyRate || 200,
              pitch: 'Direct booking reservation request sent via talent profile.',
              status: 'pending',
              createdAt: 'Just now',
            };
            setApplications([newApp, ...applications]);
          }}
        />
      )}
    </div>
  );
}

export default App;
