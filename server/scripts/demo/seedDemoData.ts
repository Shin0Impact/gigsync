// Fills the database with a believable demo community: users with profile
// pictures, posts with real photos / videos / audio, comments, likes,
// follows, events with applications, portfolios, availability, and chats.
//
//   npm run demo:seed                 # insert (after demo:media and demo:wipe)
//   npm run demo:seed -- --plan-only  # print the plan, touch nothing
//   npm run demo:seed -- --skip-upload  # DB only (files already in R2)
//
// Every account uses an @gigsync-demo.test email and the password printed at
// the end, so `npm run demo:wipe -- --demo-only --confirm` removes it all again.
// Deterministic: the same media folder always produces the same dataset.
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { pool } from "../../src/config/db";
import { r2Client } from "../../src/config/r2";
import { env } from "../../src/config/env";
import {
	CATEGORIES, CITIES, COMMENTS_BY_CATEGORY, COMMENTS_GENERAL, COVER_NOTES, EVENT_TEMPLATES, FEMALE_FIRST, FAN_BIOS,
	LAST_NAMES, MALE_FIRST, MESSAGES_ARTIST, MESSAGES_ORGANIZER, POSTS, UPDATE_NOTES, make_rng,
	type Category,
} from "./content";
import type { ManifestEntry } from "./fetchDemoMedia";

void FAN_BIOS; // profiles have no bio column yet; kept in content.ts for later

const args = process.argv.slice(2);
const PLAN_ONLY = args.includes("--plan-only");
const SKIP_UPLOAD = args.includes("--skip-upload");

const MEDIA_DIR = path.resolve(__dirname, "media");
const DEMO_DOMAIN = "gigsync-demo.test";
const DEMO_PASSWORD = "DemoPass123!";
const rng = make_rng(20261015);
const NOW = Date.now();
const DAY = 86_400_000;

const iso = (ms: number) => new Date(ms).toISOString();
const ago_days = (d: number) => NOW - d * DAY;

// ----------------------------------------------------------------- media --

const manifest: ManifestEntry[] = fs.existsSync(path.join(MEDIA_DIR, "manifest.json"))
	? (JSON.parse(fs.readFileSync(path.join(MEDIA_DIR, "manifest.json"), "utf8")) as ManifestEntry[]).filter((e) =>
			fs.existsSync(path.join(MEDIA_DIR, e.file)),
		)
	: [];

if (manifest.length === 0) {
	console.error("No media found. Run `npm run demo:media` first (see scripts/demo/README.md).");
	process.exit(1);
}

const usage = new Map<string, number>();

// Pick `count` distinct entries, least-used first (random among ties).
function take(pool_: ManifestEntry[], count: number, avoid: Set<string> = new Set()): ManifestEntry[] {
	const ranked = rng.shuffle(pool_.filter((e) => !avoid.has(e.id))).sort((a, b) => (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0));
	const chosen = ranked.slice(0, count);
	for (const e of chosen) {
		usage.set(e.id, (usage.get(e.id) ?? 0) + 1);
		avoid.add(e.id);
	}
	return chosen;
}

const images = (tag: string) => manifest.filter((e) => e.kind === "image" && e.tags.includes(tag) && !e.tags.includes("avatar"));
const videos = (tag: string) => manifest.filter((e) => e.kind === "video" && e.tags.includes(tag));
const audios = manifest.filter((e) => e.kind === "audio");
const avatars = { female: manifest.filter((e) => e.tags.includes("avatar") && e.tags.includes("female")), male: manifest.filter((e) => e.tags.includes("avatar") && e.tags.includes("male")) };

const mediaKey = (e: ManifestEntry) => `demo/${e.kind}/${path.basename(e.file)}`;

// ------------------------------------------------------------------ plan --

interface PlanUser {
	email: string;
	userName: string;
	name: string;
	role: "artist" | "organizer" | "fan";
	category: Category | null;
	gender: "female" | "male";
	city: (typeof CITIES)[number];
	lat: number;
	lng: number;
	avatar: ManifestEntry | null;
	createdAt: number;
	verified: boolean;
	emergency: boolean;
	id?: string;
}

const COUNTS = { painter: 9, photographer: 9, designer: 8, musician: 9, organizer: 8, fan: 7 };
const ORGANIZER_NAMES = [
	"Harbour Gallery", "The Back Room", "Studio 12", "Skyline Rooftop", "Old Town Cultural Centre", "Cafe Kinor", "Art Collective", "Gallery Nine",
];

const used_usernames = new Set<string>();
const used_names = new Set<string>();

function make_username(base: string): string {
	let u = base.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
	if (used_usernames.has(u)) u = `${u}_${rng.int(10, 99)}`;
	used_usernames.add(u);
	return u;
}

function make_person(): { name: string; gender: "female" | "male"; first: string; last: string } {
	for (;;) {
		const gender = rng.chance(0.5) ? "female" : "male";
		const first = rng.pick(gender === "female" ? FEMALE_FIRST : MALE_FIRST);
		const last = rng.pick(LAST_NAMES);
		const name = `${first} ${last}`;
		if (!used_names.has(name)) {
			used_names.add(name);
			return { name, gender, first, last };
		}
	}
}

const avatar_cursor = { female: 0, male: 0 };
function next_avatar(gender: "female" | "male"): ManifestEntry | null {
	const list = [...avatars[gender]].sort((a, b) => a.id.localeCompare(b.id));
	if (list.length === 0) return null;
	const entry = list[avatar_cursor[gender] % list.length];
	avatar_cursor[gender] += 1;
	return entry;
}

function build_users(): PlanUser[] {
	const out: PlanUser[] = [];
	const venueImgs = images("event");
	const venuePicks = take(venueImgs, COUNTS.organizer);

	const add = (role: PlanUser["role"], category: Category | null, label?: string, venueAvatar?: ManifestEntry) => {
		const person = make_person();
		const name = label ?? person.name;
		const userName = make_username(label ?? `${person.first}_${person.last}`);
		const city = rng.pick(CITIES);
		out.push({
			email: `${userName}@${DEMO_DOMAIN}`,
			userName,
			name,
			role,
			category,
			gender: person.gender,
			city,
			lat: city.lat + (rng.next() - 0.5) * 0.06,
			lng: city.lng + (rng.next() - 0.5) * 0.06,
			avatar: venueAvatar ?? next_avatar(person.gender),
			createdAt: ago_days(rng.int(20, 90)),
			verified: role === "artist" ? rng.chance(0.25) : role === "organizer" ? rng.chance(0.5) : false,
			emergency: role === "artist" && rng.chance(0.25),
		});
	};

	for (const category of CATEGORIES) for (let i = 0; i < COUNTS[category]; i += 1) add("artist", category);
	for (let i = 0; i < COUNTS.organizer; i += 1) add("organizer", null, ORGANIZER_NAMES[i], venuePicks[i]);
	for (let i = 0; i < COUNTS.fan; i += 1) add("fan", null);
	return out;
}

interface PlanMedia {
	entry: ManifestEntry;
	sortOrder: number;
}
interface PlanUpdate {
	description: string;
	createdAt: number;
	media: PlanMedia[];
}
interface PlanWork {
	owner: PlanUser;
	title: string;
	description: string;
	createdAt: number;
	updates: PlanUpdate[];
	id?: number;
}

function pick_update_media(category: Category, first: boolean): ManifestEntry[] {
	const local = new Set<string>();
	const out: ManifestEntry[] = [];
	const imgs = images(category);
	const vids = videos(category);
	const roll = rng.next();

	if (category === "musician") {
		if (roll < 0.4 && audios.length) out.push(...take(audios, 1, local));
		else if (roll < 0.7 && vids.length) out.push(...take(vids, 1, local));
		else out.push(...take(imgs, 1, local));
		if (first && audios.length && out[0]?.kind !== "audio" && rng.chance(0.4)) out.push(...take(audios, 1, local));
		if (first && out.some((m) => m.kind === "audio") && rng.chance(0.6)) out.unshift(...take(imgs, 1, local));
	} else if (roll < 0.22 && vids.length) {
		out.push(...take(vids, 1, local));
	} else {
		out.push(...take(imgs, rng.chance(0.4) ? 2 : 1, local));
	}
	return out.length > 0 ? out : take(manifest.filter((e) => e.kind === "image" && !e.tags.includes("avatar")), 1, local);
}

function build_works(users: PlanUser[]): PlanWork[] {
	const works: PlanWork[] = [];
	for (const owner of users.filter((u) => u.role === "artist")) {
		const category = owner.category as Category;
		const templates = rng.shuffle(POSTS[category]);
		const count = rng.int(3, 6);
		for (let i = 0; i < count; i += 1) {
			const t = templates[i % templates.length];
			const createdAt = Math.max(owner.createdAt + DAY, ago_days(rng.int(1, 45)) - rng.int(0, 20) * 3_600_000);
			const updateCount = rng.chance(0.35) ? rng.int(2, 3) : 1;
			const updates: PlanUpdate[] = [];
			for (let u = 0; u < updateCount; u += 1) {
				const when = Math.min(NOW - 600_000, createdAt + u * rng.int(1, 5) * DAY + u * 3_600_000);
				updates.push({
					description: u === 0 ? t.description : rng.pick(UPDATE_NOTES),
					createdAt: when,
					media: pick_update_media(category, u === 0).map((entry, idx) => ({ entry, sortOrder: idx })),
				});
			}
			works.push({ owner, title: i >= templates.length ? `${t.title} II` : t.title, description: t.description, createdAt, updates });
		}
	}
	return works;
}

// --------------------------------------------------------------- uploads --

const uploaded = new Set<string>();

async function upload(entry: ManifestEntry) {
	if (uploaded.has(entry.id) || SKIP_UPLOAD) return;
	const Key = mediaKey(entry);
	const file = path.join(MEDIA_DIR, entry.file);
	const size = fs.statSync(file).size;
	try {
		const head = await r2Client.send(new HeadObjectCommand({ Bucket: env.r2.bucketName, Key }));
		if (head.ContentLength === size) {
			uploaded.add(entry.id);
			return;
		}
	} catch {
		// not there yet
	}
	await r2Client.send(new PutObjectCommand({ Bucket: env.r2.bucketName, Key, Body: fs.readFileSync(file), ContentType: entry.mime, ContentLength: size }));
	uploaded.add(entry.id);
}

async function upload_all(entries: ManifestEntry[]) {
	const unique = Array.from(new Map(entries.map((e) => [e.id, e])).values());
	let done = 0;
	const queue = [...unique];
	const worker = async () => {
		for (let e = queue.shift(); e; e = queue.shift()) {
			await upload(e);
			done += 1;
			if (!SKIP_UPLOAD && (done % 20 === 0 || done === unique.length)) console.log(`  uploaded ${done}/${unique.length}`);
		}
	};
	await Promise.all(Array.from({ length: 6 }, worker));
}

// ------------------------------------------------------------------ main --

function weighted_sample<T>(items: T[], weight: (t: T) => number, n: number): T[] {
	return items
		.map((item) => ({ item, key: Math.pow(rng.next(), 1 / Math.max(weight(item), 0.01)) }))
		.sort((a, b) => b.key - a.key)
		.slice(0, n)
		.map((x) => x.item);
}

function strip_query_tag(alt: string): string {
	return alt.replace(/^\[[^\]]*\]\s*/, "").trim() || "Demo media";
}

async function main() {
	const users = build_users();
	const works = build_works(users);
	const artists = users.filter((u) => u.role === "artist");
	const organizers = users.filter((u) => u.role === "organizer");

	// Events ---------------------------------------------------------------
	interface PlanEvent {
		organizer: PlanUser;
		title: string;
		description: string;
		venue: string;
		categories: Category[];
		startAt: number;
		endAt: number;
		status: "open" | "filled" | "completed";
		urgent: boolean;
		recurring: string | null;
		media: ManifestEntry[];
		id?: number;
	}
	const events: PlanEvent[] = EVENT_TEMPLATES.map((t, i) => {
		const urgent = t.title.startsWith("Urgent");
		const past = !urgent && i % 5 === 3; // 4 past events
		const dayOffset = past ? -rng.int(7, 40) : urgent ? 0 : rng.int(2, 60);
		let start: number;
		if (urgent) {
			start = NOW + 3 * 3_600_000;
			const midnight = new Date(NOW);
			midnight.setHours(23, 0, 0, 0);
			if (start > midnight.getTime()) start = NOW + 3_600_000;
		} else {
			const d = new Date(NOW + dayOffset * DAY);
			d.setHours(rng.int(17, 20), rng.pick([0, 30]), 0, 0);
			start = d.getTime();
		}
		const recurring = /Open Mic|Weekly|Blues|Folk/.test(t.title) ? "WEEKLY" : /Songwriters/.test(t.title) ? "MONTHLY" : null;
		const imgPool = [...images("event"), ...t.categories.flatMap((c) => images(c))];
		const media = [...take(imgPool, rng.int(2, 3)), ...(rng.chance(0.25) ? take(videos("event"), 1) : [])];
		return {
			organizer: organizers[i % organizers.length],
			title: t.title,
			description: t.description,
			venue: t.venue,
			categories: t.categories,
			startAt: start,
			endAt: start + (urgent ? 2.5 : rng.int(2, 4)) * 3_600_000,
			status: past ? "completed" : i % 7 === 5 ? "filled" : "open",
			urgent,
			recurring,
			media,
		};
	});

	// Everything that must exist in R2
	const needed: ManifestEntry[] = [
		...users.flatMap((u) => (u.avatar ? [u.avatar] : [])),
		...works.flatMap((w) => w.updates.flatMap((u) => u.media.map((m) => m.entry))),
		...events.flatMap((e) => e.media),
	];
	const counts = (k: string) => needed.filter((e) => e.kind === k).length;
	console.log(`Plan: ${users.length} users (${artists.length} artists, ${organizers.length} organizers, ${COUNTS.fan} fans), ${works.length} posts, ${events.length} events`);
	console.log(`Media referenced: ${Array.from(new Set(needed.map((n) => n.id))).length} unique files (${counts("image")} image refs, ${counts("video")} video refs, ${counts("audio")} audio refs)`);
	if (users.some((u) => !u.avatar)) console.warn("WARNING: not enough avatar photos - some users will have no profile picture. Re-run demo:media or add more avatars.");
	if (PLAN_ONLY) return;

	console.log("\nUploading media to R2...");
	await upload_all(needed);

	console.log("\nWriting to the database...");
	const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);
	const client = await pool.connect();
	try {
		const { rows: existing } = await client.query(`SELECT 1 FROM users WHERE email LIKE $1 LIMIT 1`, [`%@${DEMO_DOMAIN}`]);
		if (existing.length > 0) {
			console.error(`Demo users already exist. Run: npm run demo:wipe -- --demo-only --confirm   then seed again.`);
			process.exit(1);
		}

		await client.query("BEGIN");

		// users / roles / profiles
		for (const u of users) {
			const created = iso(u.createdAt);
			const { rows } = await client.query<{ id: string }>(
				`INSERT INTO users (email, password_hash, email_verified, created_at, updated_at) VALUES ($1, $2, true, $3, $3) RETURNING id`,
				[u.email, password_hash, created],
			);
			u.id = rows[0].id;
			await client.query(`INSERT INTO roles (user_id, role, created_at) VALUES ($1, $2, $3)`, [u.id, u.role, created]);
			await client.query(
				`INSERT INTO profiles (user_name, user_id, name, artists_type, avatar_url, is_verified, location, is_emergency_available, emergency_until, created_at)
				 VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7::float8, $8::float8), 4326)::geography, $9, $10, $11)`,
				[
					u.userName, u.id, u.name, u.category, u.avatar ? mediaKey(u.avatar) : null, u.verified, u.lng, u.lat,
					u.emergency, u.emergency ? iso(NOW + rng.int(2, 10) * 3_600_000) : null, created,
				],
			);
		}
		console.log(`  ${users.length} users`);

		// works / updates / media
		let mediaRows = 0;
		for (const w of works) {
			const { rows } = await client.query<{ id: number }>(
				`INSERT INTO works (user_id, title, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) RETURNING id`,
				[w.owner.id, w.title, w.description, iso(w.createdAt)],
			);
			w.id = rows[0].id;
			let version = 1;
			for (const up of w.updates) {
				const r = await client.query<{ id: number }>(
					`INSERT INTO work_updates (work_id, version_number, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) RETURNING id`,
					[w.id, version, up.description, iso(up.createdAt)],
				);
				version += 1;
				for (const m of up.media) {
					await client.query(
						`INSERT INTO update_media (update_id, media_type, r2_key, mime_type, file_size, sort_order, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
						[r.rows[0].id, m.entry.kind, mediaKey(m.entry), m.entry.mime, m.entry.bytes, m.sortOrder, iso(up.createdAt)],
					);
					mediaRows += 1;
				}
			}
			await client.query(`UPDATE works SET updated_at = $2 WHERE id = $1`, [w.id, iso(w.updates[w.updates.length - 1].createdAt)]);
		}
		console.log(`  ${works.length} posts, ${mediaRows} media rows`);

		// likes + comments
		const everyone = users;
		let likeRows = 0;
		let commentRows = 0;
		for (const w of works) {
			const others = everyone.filter((u) => u.id !== w.owner.id);
			const likers = rng.shuffle(others).slice(0, rng.int(2, Math.min(24, others.length)));
			if (likers.length) {
				await client.query(
					`INSERT INTO work_likes (work_id, user_id, created_at) SELECT $1, x.u, x.t FROM unnest($2::uuid[], $3::timestamptz[]) AS x(u, t)`,
					[w.id, likers.map((l) => l.id), likers.map(() => iso(Math.min(NOW - 60_000, w.createdAt + rng.int(1, 200) * 3_600_000)))],
				);
				likeRows += likers.length;
			}
			const commenters = rng.shuffle(others).slice(0, rng.chance(0.15) ? 0 : rng.int(1, 6));
			for (const c of commenters) {
				const pool_ = rng.chance(0.5) ? COMMENTS_BY_CATEGORY[w.owner.category as Category] : COMMENTS_GENERAL;
				const when = Math.min(NOW - 60_000, w.createdAt + rng.int(1, 150) * 3_600_000);
				await client.query(`INSERT INTO work_comments (work_id, user_id, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $4)`, [
					w.id, c.id, rng.pick(pool_), iso(when),
				]);
				commentRows += 1;
			}
		}
		console.log(`  ${likeRows} likes, ${commentRows} comments`);

		// follows (artists and organizers are followed more)
		const weight = (u: PlanUser) => (u.role === "artist" ? 3 : u.role === "organizer" ? 2 : 0.5);
		let followRows = 0;
		for (const u of users) {
			const targets = weighted_sample(users.filter((x) => x.id !== u.id), weight, rng.int(6, 24));
			await client.query(
				`INSERT INTO followings (user_id, followed_id, created_at) SELECT $1, x.f, x.t FROM unnest($2::uuid[], $3::timestamptz[]) AS x(f, t)`,
				[u.id, targets.map((t) => t.id), targets.map(() => iso(Math.max(u.createdAt, ago_days(rng.int(0, 60)))))],
			);
			followRows += targets.length;
		}
		await client.query(
			`UPDATE profiles p SET followers_number = (SELECT count(*) FROM followings f WHERE f.followed_id = p.user_id) WHERE p.user_id = ANY($1::uuid[])`,
			[users.map((u) => u.id)],
		);
		console.log(`  ${followRows} follows`);

		// events + media + applications
		let appRows = 0;
		for (const e of events) {
			const loc = { lat: e.organizer.lat + (rng.next() - 0.5) * 0.02, lng: e.organizer.lng + (rng.next() - 0.5) * 0.02 };
			const { rows } = await client.query<{ id: number }>(
				`INSERT INTO event (organizer_id, title, descriptions, start_at, end_at, venue_name, location, is_recurring, recurring_rule, status, categories_needed, is_urgent, created_at, updated_at)
				 VALUES ($1, $2, $3, ($4::timestamptz AT TIME ZONE 'UTC'), ($5::timestamptz AT TIME ZONE 'UTC'), $6,
				         ST_SetSRID(ST_MakePoint($7::float8, $8::float8), 4326)::geography, $9, $10, $11, $12::"ArtistCategory"[], $13, $14, $14)
				 RETURNING id`,
				[e.organizer.id, e.title, e.description, iso(e.startAt), iso(e.endAt), e.venue, loc.lng, loc.lat, e.recurring !== null, e.recurring, e.status, e.categories, e.urgent, iso(Math.min(NOW, e.startAt - rng.int(3, 20) * DAY))],
			);
			e.id = rows[0].id;
			let order = 0;
			for (const m of e.media) {
				await client.query(`INSERT INTO event_media (event_id, media_type, object_key, alt_text, sort_order) VALUES ($1, $2, $3, $4, $5)`, [
					e.id, m.kind, mediaKey(m), strip_query_tag(m.alt).slice(0, 200), order,
				]);
				order += 1;
			}

			const matching = artists.filter((a) => e.categories.includes(a.category as Category));
			const pool_ = rng.shuffle([...matching, ...rng.shuffle(artists).slice(0, 4)]).filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i);
			const applicants = pool_.slice(0, e.urgent ? rng.int(2, 4) : rng.int(3, 9));
			let acceptedLeft = e.status === "open" ? 0 : rng.int(1, 3);
			for (const a of applicants) {
				let status: "pending" | "accepted" | "rejected";
				if (acceptedLeft > 0) {
					status = "accepted";
					acceptedLeft -= 1;
				} else if (e.status === "open") {
					const r = rng.next();
					status = r < 0.55 ? "pending" : r < 0.8 ? "accepted" : "rejected";
				} else {
					status = rng.chance(0.5) ? "rejected" : "pending";
				}
				const applied = Math.min(NOW - 60_000, e.startAt - rng.int(1, 14) * DAY);
				await client.query(
					`INSERT INTO event_applications (event_id, artist_id, status, cover_note, applied_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5) ON CONFLICT DO NOTHING`,
					[e.id, a.id, status, rng.pick(COVER_NOTES), iso(Math.min(applied, NOW - 60_000))],
				);
				appRows += 1;
			}
		}
		console.log(`  ${events.length} events, ${appRows} applications`);

		// portfolios (showcase) + availability
		let showRows = 0;
		let availRows = 0;
		for (const a of artists) {
			const myWorks = works.filter((w) => w.owner.id === a.id);
			const items: { work?: number; event?: number }[] = [];
			if (rng.chance(0.7)) for (const w of rng.shuffle(myWorks).slice(0, rng.int(1, 2))) items.push({ work: w.id });
			const accepted = await client.query<{ event_id: number }>(`SELECT event_id FROM event_applications WHERE artist_id = $1 AND status = 'accepted' LIMIT 2`, [a.id]);
			for (const row of accepted.rows) items.push({ event: row.event_id });
			let order = 0;
			for (const item of items) {
				await client.query(`INSERT INTO showcase_items (user_id, event_id, work_id, sort_order) VALUES ($1, $2, $3, $4)`, [a.id, item.event ?? null, item.work ?? null, order]);
				order += 1;
				showRows += 1;
			}
			const days = rng.shuffle(Array.from({ length: 60 }, (_, i) => i + 1)).slice(0, rng.int(3, 8));
			for (const d of days) {
				await client.query(`INSERT INTO artist_availability (user_id, available_date) VALUES ($1, ($2::timestamptz)::date) ON CONFLICT DO NOTHING`, [a.id, iso(NOW + d * DAY)]);
				availRows += 1;
			}
		}
		console.log(`  ${showRows} portfolio items, ${availRows} availability days`);

		// conversations
		let convRows = 0;
		let msgRows = 0;
		const pairs = new Set<string>();
		for (let i = 0; i < 16; i += 1) {
			const org = rng.pick(organizers);
			const art = rng.pick(artists);
			const key = `${org.id}:${art.id}`;
			if (pairs.has(key)) continue;
			pairs.add(key);
			const conv = await client.query<{ id: string }>(`INSERT INTO conversations (created_at) VALUES ($1) RETURNING id`, [iso(ago_days(rng.int(2, 20)))]);
			await client.query(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`, [conv.rows[0].id, org.id, art.id]);
			convRows += 1;
			const n = rng.int(3, 8);
			let t = ago_days(rng.int(1, 18));
			for (let m = 0; m < n; m += 1) {
				const fromOrg = m % 2 === 0;
				const text = (fromOrg ? MESSAGES_ORGANIZER : MESSAGES_ARTIST)[Math.floor(m / 2) % 4];
				t = Math.min(NOW - 60_000, t + rng.int(5, 600) * 60_000);
				await client.query(`INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at) VALUES ($1, $2, $3, $4, $5)`, [
					conv.rows[0].id, fromOrg ? org.id : art.id, text, m < n - 2 || rng.chance(0.4), iso(t),
				]);
				msgRows += 1;
			}
		}
		console.log(`  ${convRows} conversations, ${msgRows} messages`);

		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK").catch(() => undefined);
		throw error;
	} finally {
		client.release();
		await pool.end();
	}

	fs.mkdirSync(path.resolve(__dirname, "out"), { recursive: true });
	const csv = ["email,username,name,role,category", ...users.map((u) => `${u.email},${u.userName},"${u.name}",${u.role},${u.category ?? ""}`)].join("\n");
	fs.writeFileSync(path.resolve(__dirname, "out/demo-accounts.csv"), csv);

	console.log(`\nDone. Log in as any demo account with password: ${DEMO_PASSWORD}`);
	console.log("Account list: scripts/demo/out/demo-accounts.csv");
	console.log(`  e.g. artist: ${artists[0].email}   organizer: ${organizers[0].email}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
