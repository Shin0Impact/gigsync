import { IArtistProfile, IConversation, IEvent, IMessage, IUser, UserRole } from '../types';

export interface IApplication {
  id: string;
  eventId: string;
  artistId: string;
  artistName: string;
  artistAvatar?: string;
  category: string;
  rateProposed: number;
  pitch: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface IExtendedArtistProfile extends IArtistProfile {
  locationName: string;
  tagline: string;
  portfolio: {
    id: string;
    type: 'audio' | 'image' | 'video';
    title: string;
    url: string;
    thumbnailUrl?: string;
    description?: string;
  }[];
  reviews: {
    id: string;
    authorName: string;
    eventName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

// Pre-seeded mock database
export const mockUsers: Record<string, IUser & { passwordHash?: string }> = {
  'user-artist-1': {
    id: 'user-artist-1',
    email: 'alex@example.com',
    name: 'Alex Rivers',
    role: 'artist',
    avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=face',
    isVerified: true,
  },
  'user-artist-2': {
    id: 'user-artist-2',
    email: 'sofia@example.com',
    name: 'Sofia Chen',
    role: 'artist',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
    isVerified: true,
  },
  'user-artist-3': {
    id: 'user-artist-3',
    email: 'drift@example.com',
    name: 'Marcus "DJ Drift" Vance',
    role: 'artist',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    isVerified: true,
  },
  'user-artist-4': {
    id: 'user-artist-4',
    email: 'dave@example.com',
    name: 'Dave K.',
    role: 'artist',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
    isVerified: false,
  },
  'user-artist-5': {
    id: 'user-artist-5',
    email: 'elena@example.com',
    name: 'Elena Rostova',
    role: 'artist',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
    isVerified: true,
  },
  'user-org-1': {
    id: 'user-org-1',
    email: 'maya@velvetlounge.com',
    name: 'Maya Lin',
    role: 'organizer',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
    isVerified: true,
  },
  'user-fan-1': {
    id: 'user-fan-1',
    email: 'jordan@example.com',
    name: 'Jordan Taylor',
    role: 'fan',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face',
    isVerified: false,
  },
};

export const mockArtists: IExtendedArtistProfile[] = [
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
        comment: 'Alex arrived early, read the crowd mood effortlessly, and delivered a sublime acoustic set. Booked him again on the spot!',
        date: '2026-08-20',
      },
      {
        id: 'rev-2',
        authorName: 'David H.',
        eventName: 'Private Anniversary Gathering',
        rating: 5,
        comment: 'His vocals are mesmerizing. Made our evening unforgettable.',
        date: '2026-07-14',
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
        title: 'Neon Odyssey (Completed in 45 Mins)',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&h=600&fit=crop',
        description: 'Live performance piece created on stage with UV acrylics.',
      },
      {
        id: 'port-5',
        type: 'image',
        title: 'Gallery Showcase Canvas',
        url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&h=600&fit=crop',
      },
    ],
    reviews: [
      {
        id: 'rev-3',
        authorName: 'Apex Galley',
        eventName: 'Modern Resonance Opening',
        rating: 5,
        comment: 'Watching Sofia paint live was the highlight of our gala. Attendees were completely captivated.',
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
    bio: 'Versatile vinyl & digital DJ curating vibrant sonic journeys for upscale clubs, art gatherings, and outdoor sunset terraces. Fully self-sufficient sound kit available.',
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
      {
        id: 'port-7',
        type: 'image',
        title: 'Midnight Deck Control',
        url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
      },
    ],
    reviews: [
      {
        id: 'rev-4',
        authorName: 'Echo Events',
        eventName: 'Summer Solstice Night',
        rating: 5,
        comment: 'Marcus keeps the energy at the exact right frequency all night. Flawless transitions.',
        date: '2026-08-02',
      },
    ],
  },
  {
    id: 'artist-4',
    userId: 'user-artist-4',
    name: 'Dave K.',
    locationName: 'Midtown Entertainment Strip',
    tagline: 'Stand-Up Comedy & Charismatic Event Host',
    bio: 'High-energy stand-up comic and emcee featured on regional comedy clubs and festivals. Clean corporate or edgy club sets available on request.',
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
        title: 'Mic Night at The Laugh Cellar',
        url: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=600&fit=crop',
      },
    ],
    reviews: [
      {
        id: 'rev-5',
        authorName: 'City Laughs Festival',
        eventName: 'Indie Comedy Showcase',
        rating: 5,
        comment: 'Dave stepped in as last-minute host when our emcee called sick and owned the room immediately.',
        date: '2026-08-25',
      },
    ],
  },
  {
    id: 'artist-5',
    userId: 'user-artist-5',
    name: 'Elena Rostova',
    locationName: 'West Riverside',
    tagline: 'Aerial Silk, Fire Dance & Visual Performance Art',
    bio: 'Trained circus artist specializing in mesmerizing aerial silks, LED flow art, and ambient stage movement. Perfect for high-impact visual spectacles.',
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
        title: 'Aerial Silk Flow in Crimson',
        url: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&h=600&fit=crop',
      },
    ],
    reviews: [
      {
        id: 'rev-6',
        authorName: 'Lumina Productions',
        eventName: 'Gala Fundraiser',
        rating: 5,
        comment: 'Elena left all 300 guests speechless. Professionalism of the highest caliber.',
        date: '2026-07-29',
      },
    ],
  },
];

export const mockEvents: (IEvent & { budget?: number; locationCoords?: { lat: number; lng: number } })[] = [
  {
    id: 'event-1',
    organizerId: 'user-org-1',
    title: 'Sunset Acoustic & Wine Pairing Evening',
    description: 'Looking for a skilled fingerstyle acoustic guitarist or indie vocalist to provide warm, ambient melodies for our garden terrace dinner service.',
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
    description: 'Urgent replacement needed for a 25-minute stand-up set following an unexpected performer cancellation. High-energy crowd ready for laughs.',
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
    description: 'We require a visual artist to execute a vibrant live canvas painting during the 2-hour opening reception. Canvas and easel provided; artist brings pigments.',
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
  {
    id: 'event-5',
    organizerId: 'user-org-1',
    title: 'Warehouse Theater Experimental Movement',
    description: 'Short interactive theatrical & physical movement performance pieces for our quarterly multidisciplinary community festival.',
    venueName: 'Warehouse 9 Cultural Hub',
    eventDate: 'Next Sunday • 4:00 PM',
    status: 'open',
    categoriesNeeded: ['Theater / Acting', 'Dance', 'Magic / Performance Art'],
    budget: 350,
  },
];

export const mockApplications: IApplication[] = [
  {
    id: 'app-1',
    eventId: 'event-1',
    artistId: 'artist-1',
    artistName: 'Alex Rivers',
    artistAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=face',
    category: 'Music',
    rateProposed: 400,
    pitch: 'I have played rooftop venues extensively and my acoustic repertoire fits wine pairings perfectly. My portable sound rig is ready to roll tonight.',
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
    pitch: 'I specialize in fast, high-contrast acrylic pieces that evolve rhythmically alongside the evening. Check out my live gallery portfolio!',
    status: 'pending',
    createdAt: '5 hours ago',
  },
  {
    id: 'app-3',
    eventId: 'event-2',
    artistId: 'artist-4',
    artistName: 'Dave K.',
    artistAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
    category: 'Stand-up Comedy',
    rateProposed: 250,
    pitch: 'I live 1.8km away and can be on stage in 20 minutes notice. Tight, punchy 25-minute set ready.',
    status: 'pending',
    createdAt: '1 hour ago',
  },
];

export const mockConversations: (IConversation & {
  partner: { id: string; name: string; avatarUrl?: string; role: string };
  lastMessage: string;
})[] = [
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

export const mockMessages: Record<string, IMessage[]> = {
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
      content: 'Thank you Maya! That sounds like a wonderful crowd. Do you have a direct PA or should I bring my Fishman acoustic amplifier?',
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
    {
      id: 'msg-7',
      conversationId: 'conv-2',
      senderId: 'user-artist-2',
      content: 'I can bring my 48x36 heavy canvas. Will there be spotlighting above the easel?',
      isRead: true,
      createdAt: 'Today, 11:20 AM',
    },
  ],
};
