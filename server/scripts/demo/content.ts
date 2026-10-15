// Text content for the demo dataset. Pure data + a tiny seeded RNG so every
// run of the seeder produces the same "people" (re-runs are reproducible).

export type Category = "painter" | "photographer" | "designer" | "musician";
export const CATEGORIES: Category[] = ["painter", "photographer", "designer", "musician"];

// mulberry32 - small deterministic PRNG.
export function make_rng(seed: number) {
	let a = seed >>> 0;
	const next = () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	return {
		next,
		int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
		pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
		chance: (p: number) => next() < p,
		shuffle: <T>(items: readonly T[]): T[] => {
			const copy = [...items];
			for (let i = copy.length - 1; i > 0; i -= 1) {
				const j = Math.floor(next() * (i + 1));
				[copy[i], copy[j]] = [copy[j], copy[i]];
			}
			return copy;
		},
	};
}

export type Rng = ReturnType<typeof make_rng>;

// Invented names (mixed backgrounds, matches the Haifa/Tel Aviv demo setting).
export const FEMALE_FIRST = [
	"Dana", "Maya", "Noa", "Tamar", "Rana", "Shiraz", "Yael", "Lina", "Salma", "Hila",
	"Nour", "Talia", "Layla", "Michal", "Reem", "Adi", "Sara", "Elena", "Amira", "Gali",
	"Inbar", "Samira", "Noga", "Dina", "Mira",
];
export const MALE_FIRST = [
	"Omar", "Lior", "Yusuf", "Itai", "Gal", "Fadi", "Daniel", "Tariq", "Amit", "Karim",
	"Eyal", "Rami", "Noam", "Jad", "Oren", "Sami", "Yonatan", "Hassan", "Ido", "Nadav",
	"Marwan", "Ben", "Elias", "Tomer", "Walid",
];
export const LAST_NAMES = [
	"Cohen", "Haddad", "Ben-David", "Peretz", "Shapiro", "Khalil", "Avraham", "Golan", "Mansour", "Nahum",
	"Amar", "Qasem", "Levi", "Mizrahi", "Saleh", "Katz", "Dahan", "Nasser", "Friedman", "Azoulay",
	"Habib", "Barak", "Sabbagh", "Rosen", "Zoabi", "Shalom", "Issa", "Weiss", "Biton", "Hamdan",
];

export const CITIES = [
	{ name: "Haifa", lat: 32.794, lng: 34.9896 },
	{ name: "Tel Aviv", lat: 32.0853, lng: 34.7818 },
	{ name: "Jerusalem", lat: 31.7683, lng: 35.2137 },
	{ name: "Nazareth", lat: 32.6996, lng: 35.3035 },
	{ name: "Akko", lat: 32.9281, lng: 35.0818 },
	{ name: "Beersheba", lat: 31.253, lng: 34.7915 },
	{ name: "Netanya", lat: 32.3215, lng: 34.8532 },
	{ name: "Tiberias", lat: 32.7959, lng: 35.5312 },
];

export const BIOS: Record<Category, string[]> = {
	painter: [
		"Oil and acrylic on canvas. Mostly landscapes and the occasional portrait.",
		"Watercolour sketcher, always with a travel journal in my bag.",
		"Painting the city one rooftop at a time.",
		"Abstract expressionist. I work large and I work loud.",
		"Self-taught painter. Open to murals and commissions.",
	],
	photographer: [
		"Street and documentary photography. Film when I can afford it.",
		"Portraits, weddings and the odd gig. Light chaser.",
		"I photograph people at work - bakers, mechanics, musicians.",
		"Landscape photographer, up before sunrise most days.",
		"Concert and event photographer, based in the north.",
	],
	designer: [
		"Illustrator and graphic designer. Posters, covers, zines.",
		"Ceramics and product design - small batch, made by hand.",
		"Type nerd. Lettering, branding and hand-drawn logos.",
		"Printmaker and illustrator. Linocut every weekend.",
		"Visual designer who sketches everything on paper first.",
	],
	musician: [
		"Guitarist and songwriter. Available for open mics and small venues.",
		"Classically trained pianist who plays a lot of jazz now.",
		"Violinist - weddings, sessions, and the occasional folk band.",
		"Drummer looking for rehearsal room swaps and gigs.",
		"Singer-songwriter. Arabic, Hebrew and English sets.",
	],
};

export const ORGANIZER_BIOS = [
	"We run community art nights and open mics.",
	"Independent gallery space hosting emerging artists.",
	"Promoter of small live-music evenings across the north.",
	"Festival crew looking for local talent every season.",
	"Cafe with a stage, a wall for exhibitions, and strong coffee.",
	"Cultural centre programming workshops and exhibitions.",
	"Booking acoustic nights at a rooftop bar.",
	"Student-run art collective organising pop-up shows.",
];

export const FAN_BIOS = [
	"Here for the music and the murals.",
	"Gallery regular, concert goer.",
	"I collect small prints from local artists.",
	"Supporting local art one ticket at a time.",
	"Photography hobbyist and gig enthusiast.",
	"Always looking for new bands.",
	"Art student. Mostly lurking, sometimes commenting.",
];

export interface PostTemplate {
	title: string;
	description: string;
}

export const POSTS: Record<Category, PostTemplate[]> = {
	painter: [
		{ title: "Morning light study", description: "Quick oil study from the studio window. Trying to catch how the light changes in ten minutes." },
		{ title: "Work in progress: harbour view", description: "Blocking in the big shapes first. The sky always gets finished last." },
		{ title: "Watercolour sketchbook", description: "A few pages from this week. I try to paint something small every day." },
		{ title: "New canvas on the easel", description: "Starting something large. Lots of layers, lots of scraping back." },
		{ title: "Palette knife experiments", description: "Switched to knives for this one. Messier, but I like the texture." },
		{ title: "Rooftops at dusk", description: "Painted from a balcony in the old city. Wind kept stealing my brushes." },
		{ title: "Portrait practice", description: "Two-hour sitting with a friend. Charcoal first, then thin oils." },
		{ title: "Finished: still life with pears", description: "Finally done after three weeks of on-and-off work. Varnish next." },
	],
	photographer: [
		{ title: "Market at sunrise", description: "Shot on the morning walk before the stalls opened. Soft light for about twenty minutes." },
		{ title: "Street portraits series", description: "Asking strangers for five minutes. Most say yes. These are my favourites so far." },
		{ title: "Backstage at the open mic", description: "Pre-show nerves are my favourite thing to photograph." },
		{ title: "Coastline in the fog", description: "Waited two hours for the fog to lift just enough. Worth it." },
		{ title: "Hands at work", description: "Part of a long project on people who make things for a living." },
		{ title: "Black and white week", description: "Only monochrome for seven days. It changes how you look at a scene." },
		{ title: "Live set from last night", description: "Low light, high ISO, no regrets. The band was incredible." },
		{ title: "Details from the old town", description: "Peeling paint, doorways, shadows. Slow walking pays off." },
	],
	designer: [
		{ title: "Poster draft for the autumn show", description: "Three directions so far. Leaning toward the bold type version." },
		{ title: "Sketchbook dump", description: "Page after page of rough ideas. Most won't survive, a few might." },
		{ title: "Hand-lettering practice", description: "Daily lettering warm-up. Brush pen and a lot of patience." },
		{ title: "Ceramics batch", description: "First firing came out better than expected. Glazing next week." },
		{ title: "Linocut print", description: "Carved over the weekend, printed by hand. Slightly different every time." },
		{ title: "Logo exploration", description: "Rough marks for a small bakery. Keeping it warm and simple." },
		{ title: "Illustration in progress", description: "Pencil, then ink, then colour. Always in that order." },
		{ title: "Studio table today", description: "A glimpse at the creative chaos behind the finished work." },
	],
	musician: [
		{ title: "Practice session", description: "Working through a tricky passage slowly. Metronome at 60 and climbing." },
		{ title: "New song, rough take", description: "Recorded on my phone in the living room. Be kind, it's unfinished." },
		{ title: "Rehearsal with the band", description: "Tightening the set for Friday. Transitions are the hard part." },
		{ title: "Late-night improvisation", description: "No plan, just a groove and a loop. See where it goes." },
		{ title: "Soundcheck", description: "Empty room, good acoustics. Always a nice few minutes before a gig." },
		{ title: "Cover of an old favourite", description: "Slowed it down and stripped it back. Let me know what you think." },
		{ title: "Warm-up routine", description: "Scales, arpeggios and long tones. Boring but it matters." },
		{ title: "Open mic recap", description: "First time playing this one live. Hands were shaking, it went fine." },
	],
};

export const UPDATE_NOTES: string[] = [
	"Small update - changed the composition after some feedback.",
	"Added more detail today.",
	"Almost there. A few more sessions to go.",
	"Reworked the left side, much happier now.",
	"Final touches done.",
	"Took another pass on this and cleaned it up.",
	"Posted a closer look at the details.",
];

export const COMMENTS_GENERAL = [
	"Love this!", "This is beautiful.", "Great work, keep going.", "The colours here are so good.",
	"Wow, I wasn't expecting that.", "Such a strong piece.", "This made my day.", "Really nice, thanks for sharing.",
	"Can't wait to see more.", "You've got a real eye for this.", "Followed - this is excellent.", "Looks professional to me.",
	"This deserves way more attention.", "Super inspiring.", "Subtle and well done.", "Great composition.",
];

export const COMMENTS_BY_CATEGORY: Record<Category, string[]> = {
	painter: ["The brushwork is gorgeous.", "How long did this one take?", "Love the texture on this.", "Those layers - amazing depth.", "Is it for sale?"],
	photographer: ["The light in this is perfect.", "What lens did you use?", "Great framing.", "That moment, so well caught.", "Love the mood."],
	designer: ["The type choice is spot on.", "Clean and bold.", "Would love this as a print.", "Great use of negative space.", "Those lines are so confident."],
	musician: ["That groove is so tight.", "Chills. Play it at the next open mic!", "Love the tone.", "Is there a full recording?", "Beautiful melody."],
};

export const EVENT_TEMPLATES: { title: string; description: string; categories: Category[]; venue: string }[] = [
	{ title: "Open Mic Night", description: "Weekly open mic. Sign up at the door, 10 minutes per act. All styles welcome.", categories: ["musician"], venue: "The Back Room" },
	{ title: "Autumn Group Exhibition", description: "Looking for painters and photographers to show two pieces each in our autumn exhibition.", categories: ["painter", "photographer"], venue: "Harbour Gallery" },
	{ title: "Live Painting Evening", description: "Painters work live while a trio plays. Guests can watch, chat and buy on the night.", categories: ["painter", "musician"], venue: "Studio 12" },
	{ title: "Poster Design Pop-up", description: "A one-day pop-up selling local posters, prints and zines. Table space for designers.", categories: ["designer"], venue: "Market Hall" },
	{ title: "Acoustic Rooftop Session", description: "Intimate acoustic sets at sunset. Looking for two solo performers.", categories: ["musician"], venue: "Skyline Rooftop Bar" },
	{ title: "Street Photography Walk & Show", description: "Walk the old town in the morning, exhibit the best shots in the evening.", categories: ["photographer"], venue: "Old Town Cultural Centre" },
	{ title: "Jazz & Illustration Night", description: "A jazz quartet and live illustrators sharing a stage. Perfect for collaborators.", categories: ["musician", "designer"], venue: "Blue Note Cafe" },
	{ title: "Community Mural Day", description: "Help paint a 20 metre community mural. Painters and designers wanted.", categories: ["painter", "designer"], venue: "Neighbourhood Wall, Main St" },
	{ title: "Folk Evening", description: "Folk and world music night. Strings, vocals and percussion welcome to apply.", categories: ["musician"], venue: "The Olive Tree" },
	{ title: "Portrait Exhibition", description: "A portrait-themed show. Photographers and painters, bring up to three pieces.", categories: ["photographer", "painter"], venue: "Gallery Nine" },
	{ title: "Ceramics & Print Fair", description: "Table space for ceramic artists and printmakers at our seasonal fair.", categories: ["designer"], venue: "Port Warehouse" },
	{ title: "Songwriters' Circle", description: "Songwriters share new material in a round. Supportive, relaxed, no amps.", categories: ["musician"], venue: "Cafe Kinor" },
	{ title: "Sunset Sketch Meetup", description: "A casual outdoor sketching evening followed by a small show-and-tell.", categories: ["painter", "designer"], venue: "Carmel Park" },
	{ title: "Band Showcase Night", description: "Four local bands, one stage. Seeking a drummer and a keyboardist for the house set.", categories: ["musician"], venue: "The Warehouse" },
	{ title: "Photo Book Launch", description: "Launching a local photo book with a small exhibition and a live acoustic set.", categories: ["photographer", "musician"], venue: "Page One Books" },
	{ title: "Urgent: Last-minute Cover Act", description: "Our act cancelled - need a solo musician tonight. Paid, 45 minute set.", categories: ["musician"], venue: "Harbour Bar" },
	{ title: "Urgent: Live Sketch Artist Tonight", description: "Looking for a live sketch artist for a private reception this evening.", categories: ["painter", "designer"], venue: "Grand Hall" },
	{ title: "Weekly Life Drawing", description: "A weekly life drawing class looking for guest artists to lead sessions.", categories: ["painter", "designer"], venue: "Art Collective Studio" },
	{ title: "Blues Thursdays", description: "Weekly blues night, always looking for new players to sit in.", categories: ["musician"], venue: "The Cellar" },
	{ title: "Street Art Festival", description: "A weekend festival of walls, workshops and live music. Many roles open.", categories: ["painter", "designer", "musician"], venue: "Old Port" },
];

export const COVER_NOTES = [
	"I'd love to be part of this. Samples are on my profile.",
	"This is right up my street - happy to travel and set up early.",
	"Available on the date and I'd be thrilled to take part.",
	"I've done similar events before and can share references.",
	"Count me in. I can bring my own equipment.",
	"Excited about this one! Let me know what you need from me.",
];

export const MESSAGES_ORGANIZER: string[] = [
	"Hi! We loved your recent post. Would you be free for an event next month?",
	"Thanks for applying - could you tell us a bit more about what you'd show?",
	"Great, we'd like to confirm you for the evening. Is 7pm setup okay?",
	"Perfect. We'll send over the venue details tomorrow.",
];

export const MESSAGES_ARTIST: string[] = [
	"Hi, thanks for reaching out! Yes, I'm interested.",
	"Sure - I'd bring around five pieces, mostly recent work.",
	"7pm works well for me. Do you provide stands?",
	"Sounds good, looking forward to it!",
];
