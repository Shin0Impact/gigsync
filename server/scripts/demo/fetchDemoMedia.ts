// Downloads REAL (non-generated) photos, videos and audio for the demo
// dataset and writes scripts/demo/media/manifest.json describing each file
// (source, creator, licence). Run from server/ with Node 20+:
//
//   PIXABAY_API_KEY=xxxx npm run demo:media      (free key, issued instantly)
//   PEXELS_API_KEY=xxxx  npm run demo:media      (if you already have a Pexels key)
//   npm run demo:media -- --import               (use your own files, no key needed)
//
// (or put the key in the repo-root .env.) Pexels is preferred when both are set.
//
// Sources
//   - Pixabay (photos + videos, Pixabay Content License: free, no attribution
//     required, but we keep credits anyway). Results tagged as AI / illustration
//     / render are skipped.
//   - Manual import: drop files into scripts/demo/media/import/<folder>/ (see
//     README) and run with --import. Use this for portraits you are sure about.
//   - Pexels (photos + videos): people playing instruments / practising,
//     painting, drawing, ceramics, photography, venues, and portraits for
//     profile pictures. Free to use under the Pexels licence (pexels.com/license).
//   - Wikimedia Commons (audio): real recordings under CC0 / public domain /
//     CC BY / CC BY-SA (NC and ND licences are skipped). Attribution is kept
//     in the manifest and written to media/ATTRIBUTION.md.
//
// Nothing here is AI-generated. Safe to re-run: files already on disk are
// skipped, so you can top up after a failure.
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const MEDIA_DIR = path.resolve(__dirname, "media");
const MANIFEST_PATH = path.join(MEDIA_DIR, "manifest.json");
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_KEY = process.env.PIXABAY_API_KEY;
const UA = `GigSyncDemoSeeder/1.0 (university course project${process.env.DEMO_CONTACT ? `; ${process.env.DEMO_CONTACT}` : ""})`;

export type MediaKind = "image" | "video" | "audio";

export interface ManifestEntry {
	id: string;
	kind: MediaKind;
	tags: string[]; // category (painter/photographer/designer/musician), "avatar", "event", "female"/"male"
	file: string; // relative to media/
	mime: string;
	bytes: number;
	source: "pexels" | "pixabay" | "wikimedia" | "manual";
	creator: string;
	license: string;
	sourceUrl: string;
	alt: string;
}

// Words that suggest minors - we skip any result mentioning them, because
// demo "people" should be adults.
const EXCLUDE = /\b(child|children|kid|kids|boy|girl|baby|babies|toddler|teen|teenager|infant|school|student|little|youth|young boy|young girl)\b/i;

// Skip anything that looks generated / synthetic / not a real photograph.
const AI_WORDS = /\b(ai|a\.i\.|ai[- ]generated|generated|midjourney|stable diffusion|dall-?e|neural|digital art|3d|render|rendering|illustration|vector|cartoon|clipart|cgi)\b/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function load_manifest(): ManifestEntry[] {
	if (!fs.existsSync(MANIFEST_PATH)) return [];
	return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as ManifestEntry[];
}

function save_manifest(entries: ManifestEntry[]) {
	fs.mkdirSync(MEDIA_DIR, { recursive: true });
	fs.writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2));
}

async function download(url: string, dest: string, maxBytes: number, headers: Record<string, string> = {}): Promise<number | null> {
	const res = await fetch(url, { headers: { "User-Agent": UA, ...headers } });
	if (!res.ok) return null;
	const declared = Number(res.headers.get("content-length") ?? 0);
	if (declared > maxBytes) return null;
	const buf = Buffer.from(await res.arrayBuffer());
	if (buf.length === 0 || buf.length > maxBytes) return null;
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.writeFileSync(dest, buf);
	return buf.length;
}

// ---------------------------------------------------------------- Pexels --

interface PexelsPhoto {
	id: number;
	width: number;
	height: number;
	url: string;
	photographer: string;
	alt: string;
	src: { original: string };
}

interface PexelsVideoFile {
	quality: string;
	file_type: string;
	width: number;
	height: number;
	link: string;
}

interface PexelsVideo {
	id: number;
	url: string;
	duration: number;
	user: { name: string; url: string };
	video_files: PexelsVideoFile[];
}

async function pexels_get<T>(url: string): Promise<T> {
	const res = await fetch(url, { headers: { Authorization: PEXELS_KEY as string, "User-Agent": UA } });
	if (res.status === 429) {
		throw new Error("Pexels rate limit hit (200 requests/hour). Wait and re-run - already downloaded files are kept.");
	}
	if (!res.ok) throw new Error(`Pexels request failed: ${res.status} ${url}`);
	await sleep(300);
	return (await res.json()) as T;
}

// --------------------------------------------------------------- Pixabay --

interface PixabayPhoto {
	id: number;
	pageURL: string;
	tags: string;
	largeImageURL: string;
	user: string;
}

interface PixabayVideoFile {
	url: string;
	width: number;
	height: number;
	size: number;
}

interface PixabayVideo {
	id: number;
	pageURL: string;
	tags: string;
	duration: number;
	user: string;
	videos: { large?: PixabayVideoFile; medium?: PixabayVideoFile; small?: PixabayVideoFile; tiny?: PixabayVideoFile };
}

async function pixabay_get<T>(url: string): Promise<T> {
	const res = await fetch(`${url}&key=${PIXABAY_KEY}`, { headers: { "User-Agent": UA } });
	if (res.status === 429) {
		throw new Error("Pixabay rate limit hit (100 requests/minute). Wait a minute and re-run - downloaded files are kept.");
	}
	if (!res.ok) throw new Error(`Pixabay request failed: ${res.status}`);
	await sleep(700);
	return (await res.json()) as T;
}

interface PhotoJob {
	query: string;
	tags: string[];
	count: number;
	orientation?: "landscape" | "portrait" | "square";
	avatar?: boolean;
	requireAlt?: RegExp; // alt text must match (used to keep portraits as adults of the right type)
}

const PHOTO_JOBS: PhotoJob[] = [
	// Profile portraits (adults only; alt text must mention a man/woman/person)
	{ query: "portrait of a smiling woman", tags: ["avatar", "female"], count: 12, orientation: "portrait", avatar: true, requireAlt: /\b(woman|female|lady)\b/i },
	{ query: "woman headshot outdoors", tags: ["avatar", "female"], count: 10, orientation: "portrait", avatar: true, requireAlt: /\b(woman|female|lady)\b/i },
	{ query: "portrait of a woman artist", tags: ["avatar", "female"], count: 8, orientation: "portrait", avatar: true, requireAlt: /\b(woman|female|lady)\b/i },
	{ query: "portrait of a smiling man", tags: ["avatar", "male"], count: 12, orientation: "portrait", avatar: true, requireAlt: /\b(man|male|gentleman)\b/i },
	{ query: "man headshot outdoors", tags: ["avatar", "male"], count: 10, orientation: "portrait", avatar: true, requireAlt: /\b(man|male|gentleman)\b/i },
	{ query: "portrait of a bearded man", tags: ["avatar", "male"], count: 8, orientation: "portrait", avatar: true, requireAlt: /\b(man|male|gentleman)\b/i },
	// Painters
	{ query: "artist painting on canvas", tags: ["painter"], count: 10 },
	{ query: "oil painting studio", tags: ["painter"], count: 8 },
	{ query: "watercolor painting", tags: ["painter"], count: 8 },
	{ query: "painter at easel", tags: ["painter"], count: 8 },
	{ query: "abstract painting canvas", tags: ["painter"], count: 6 },
	// Photographers
	{ query: "street photography", tags: ["photographer"], count: 10 },
	{ query: "photographer with camera", tags: ["photographer"], count: 8 },
	{ query: "landscape photography sunrise", tags: ["photographer"], count: 8 },
	{ query: "black and white portrait photography", tags: ["photographer"], count: 6 },
	{ query: "concert photography", tags: ["photographer"], count: 6 },
	// Designers / illustrators / ceramics
	{ query: "drawing sketchbook", tags: ["designer"], count: 8 },
	{ query: "illustrator drawing", tags: ["designer"], count: 8 },
	{ query: "ceramics pottery making", tags: ["designer"], count: 8 },
	{ query: "hand lettering calligraphy", tags: ["designer"], count: 6 },
	{ query: "graphic design poster", tags: ["designer"], count: 6 },
	{ query: "linocut printmaking", tags: ["designer"], count: 4 },
	// Musicians
	{ query: "guitarist playing guitar", tags: ["musician"], count: 10 },
	{ query: "pianist playing piano", tags: ["musician"], count: 8 },
	{ query: "violinist practicing violin", tags: ["musician"], count: 8 },
	{ query: "drummer playing drums", tags: ["musician"], count: 6 },
	{ query: "band rehearsal", tags: ["musician"], count: 6 },
	{ query: "singer with microphone on stage", tags: ["musician"], count: 6 },
	{ query: "saxophone player", tags: ["musician"], count: 4 },
	// Event / venue photos
	{ query: "art gallery exhibition", tags: ["event"], count: 8, orientation: "landscape" },
	{ query: "live music venue stage", tags: ["event"], count: 8, orientation: "landscape" },
	{ query: "open mic night", tags: ["event"], count: 6, orientation: "landscape" },
	{ query: "art workshop studio", tags: ["event"], count: 6, orientation: "landscape" },
	{ query: "street mural wall art", tags: ["event"], count: 6, orientation: "landscape" },
];

interface Candidate {
	id: string;
	url: string; // direct download URL
	creator: string;
	pageUrl: string;
	text: string; // alt text / tags, used for the adult-only + gender filters
	license: string;
	source: ManifestEntry["source"];
	duration?: number;
}

const FEMALE_WORDS = /\b(woman|women|female|lady|ladies|girl)\b/i;

async function photo_candidates(job: PhotoJob): Promise<Candidate[]> {
	if (PEXELS_KEY) {
		const params = new URLSearchParams({ query: job.query, per_page: "40" });
		if (job.orientation) params.set("orientation", job.orientation);
		const data = await pexels_get<{ photos: PexelsPhoto[] }>(`https://api.pexels.com/v1/search?${params}`);
		const suffix = job.avatar ? "?auto=compress&cs=tinysrgb&fit=crop&w=600&h=600" : "?auto=compress&cs=tinysrgb&w=1400";
		return data.photos.map((p) => ({
			id: `pexels-photo-${p.id}`,
			url: p.src.original + suffix,
			creator: p.photographer,
			pageUrl: p.url,
			text: p.alt ?? "",
			license: "Pexels License",
			source: "pexels" as const,
		}));
	}
	const params = new URLSearchParams({
		q: job.query.slice(0, 100),
		image_type: "photo",
		per_page: "50",
		safesearch: "true",
		order: "popular",
		min_width: job.avatar ? "600" : "1000",
	});
	if (job.orientation === "portrait") params.set("orientation", "vertical");
	if (job.orientation === "landscape") params.set("orientation", "horizontal");
	const data = await pixabay_get<{ hits: PixabayPhoto[] }>(`https://pixabay.com/api/?${params}`);
	return data.hits.map((p) => ({
		id: `pixabay-photo-${p.id}`,
		url: p.largeImageURL,
		creator: p.user,
		pageUrl: p.pageURL,
		text: p.tags ?? "",
		license: "Pixabay Content License",
		source: "pixabay" as const,
	}));
}

async function fetch_photos(entries: ManifestEntry[]) {
	const have = new Set(entries.map((e) => e.id));

	for (const job of PHOTO_JOBS) {
		let got = entries.filter((e) => e.kind === "image" && job.tags.every((t) => e.tags.includes(t)) && e.alt.startsWith(`[${job.query}]`)).length;
		if (got >= job.count) continue;

		console.log(`Photos: "${job.query}" (${got}/${job.count})`);
		let candidates: Candidate[];
		try {
			candidates = await photo_candidates(job);
		} catch (error) {
			console.warn(`  ${(error as Error).message}`);
			continue;
		}

		for (const photo of candidates) {
			if (got >= job.count) break;
			if (have.has(photo.id)) continue;
			if (EXCLUDE.test(photo.text) || AI_WORDS.test(photo.text)) continue;
			if (job.requireAlt && !job.requireAlt.test(photo.text)) continue;
			if (job.tags.includes("male") && FEMALE_WORDS.test(photo.text)) continue;

			const rel = job.avatar ? `avatars/${photo.id}.jpg` : `images/${photo.id}.jpg`;
			const dest = path.join(MEDIA_DIR, rel);
			const bytes = fs.existsSync(dest) ? fs.statSync(dest).size : await download(photo.url, dest, 8 * 1024 * 1024);
			if (!bytes) continue;

			entries.push({
				id: photo.id,
				kind: "image",
				tags: job.tags,
				file: rel,
				mime: "image/jpeg",
				bytes,
				source: photo.source,
				creator: photo.creator,
				license: photo.license,
				sourceUrl: photo.pageUrl,
				alt: `[${job.query}] ${photo.text}`.trim(),
			});
			have.add(photo.id);
			got += 1;
		}
		save_manifest(entries);
	}
}

interface VideoJob {
	query: string;
	tags: string[];
	count: number;
}

const VIDEO_JOBS: VideoJob[] = [
	{ query: "playing acoustic guitar", tags: ["musician"], count: 3 },
	{ query: "playing piano", tags: ["musician"], count: 3 },
	{ query: "playing violin", tags: ["musician"], count: 2 },
	{ query: "drummer playing drums", tags: ["musician"], count: 2 },
	{ query: "painting on canvas", tags: ["painter"], count: 4 },
	{ query: "watercolor painting brush", tags: ["painter"], count: 2 },
	{ query: "drawing sketch pencil", tags: ["designer"], count: 3 },
	{ query: "pottery wheel ceramics", tags: ["designer"], count: 2 },
	{ query: "photographer taking photos", tags: ["photographer"], count: 3 },
	{ query: "art gallery visitors", tags: ["event"], count: 1 },
	{ query: "live concert crowd", tags: ["event"], count: 1 },
];

const MAX_VIDEO_BYTES = 18 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 40;

function pick_video_file(files: PexelsVideoFile[]): PexelsVideoFile | null {
	const mp4 = files.filter((f) => f.file_type === "video/mp4" && f.width >= 540 && f.width <= 1280);
	if (mp4.length === 0) return null;
	// prefer ~960 wide - good enough for a presentation, small enough to upload
	return mp4.sort((a, b) => Math.abs(a.width - 960) - Math.abs(b.width - 960))[0];
}

async function video_candidates(job: VideoJob): Promise<(Candidate & { link: string })[]> {
	if (PEXELS_KEY) {
		const params = new URLSearchParams({ query: job.query, per_page: "20" });
		const data = await pexels_get<{ videos: PexelsVideo[] }>(`https://api.pexels.com/videos/search?${params}`);
		const out: (Candidate & { link: string })[] = [];
		for (const v of data.videos) {
			const file = pick_video_file(v.video_files);
			if (!file) continue;
			out.push({
				id: `pexels-video-${v.id}`,
				url: v.url,
				link: file.link,
				creator: v.user.name,
				pageUrl: v.url,
				text: v.url,
				license: "Pexels License",
				source: "pexels",
				duration: v.duration,
			});
		}
		return out;
	}
	const params = new URLSearchParams({ q: job.query.slice(0, 100), per_page: "20", safesearch: "true", video_type: "film" });
	const data = await pixabay_get<{ hits: PixabayVideo[] }>(`https://pixabay.com/api/videos/?${params}`);
	const out: (Candidate & { link: string })[] = [];
	for (const v of data.hits) {
		// prefer ~960 wide ("small"), fall back to "medium"; skip when no mp4 url
		const file = [v.videos.small, v.videos.medium, v.videos.tiny].find((f) => f && f.url && f.size > 0 && f.size <= MAX_VIDEO_BYTES);
		if (!file) continue;
		out.push({
			id: `pixabay-video-${v.id}`,
			url: v.pageURL,
			link: file.url,
			creator: v.user,
			pageUrl: v.pageURL,
			text: v.tags ?? "",
			license: "Pixabay Content License",
			source: "pixabay",
			duration: v.duration,
		});
	}
	return out;
}

async function fetch_videos(entries: ManifestEntry[]) {
	const have = new Set(entries.map((e) => e.id));

	for (const job of VIDEO_JOBS) {
		let got = entries.filter((e) => e.kind === "video" && job.tags.every((t) => e.tags.includes(t)) && e.alt.startsWith(`[${job.query}]`)).length;
		if (got >= job.count) continue;

		console.log(`Videos: "${job.query}" (${got}/${job.count})`);
		let candidates: (Candidate & { link: string })[];
		try {
			candidates = await video_candidates(job);
		} catch (error) {
			console.warn(`  ${(error as Error).message}`);
			continue;
		}

		for (const video of candidates) {
			if (got >= job.count) break;
			if (have.has(video.id)) continue;
			if ((video.duration ?? 0) > MAX_VIDEO_SECONDS) continue;
			if (EXCLUDE.test(video.text) || AI_WORDS.test(video.text)) continue;

			const rel = `videos/${video.id}.mp4`;
			const dest = path.join(MEDIA_DIR, rel);
			const bytes = fs.existsSync(dest) ? fs.statSync(dest).size : await download(video.link, dest, MAX_VIDEO_BYTES);
			if (!bytes) continue;

			entries.push({
				id: video.id,
				kind: "video",
				tags: job.tags,
				file: rel,
				mime: "video/mp4",
				bytes,
				source: video.source,
				creator: video.creator,
				license: video.license,
				sourceUrl: video.pageUrl,
				alt: `[${job.query}] video by ${video.creator}`,
			});
			have.add(video.id);
			got += 1;
		}
		save_manifest(entries);
	}
}

// ------------------------------------------------------ Wikimedia Commons --

interface CommonsPage {
	title: string;
	imageinfo?: {
		url: string;
		descriptionurl: string;
		size: number;
		mime: string;
		mediatype: string;
		extmetadata?: Record<string, { value: string }>;
	}[];
}

const AUDIO_QUERIES = [
	"piano", "acoustic guitar", "violin", "cello", "flute", "saxophone", "jazz", "classical guitar",
	"folk song", "oud", "drums", "singing voice", "blues", "string quartet", "harp", "trumpet",
];

const AUDIO_MIME: Record<string, string> = {
	"audio/ogg": "audio/ogg",
	"application/ogg": "audio/ogg",
	"audio/mpeg": "audio/mpeg",
	"audio/wav": "audio/wav",
	"audio/x-wav": "audio/wav",
};

const OK_LICENSE = /^(cc0|public domain|pd\b|cc[- ]by(-sa)?\b)/i;
const BAD_LICENSE = /\b(nc|nd)\b|non-?commercial|no[- ]deriv/i;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

function strip_html(value: string | undefined): string {
	return (value ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

async function fetch_audio(entries: ManifestEntry[]) {
	const have = new Set(entries.map((e) => e.id));
	const wanted = 24;
	let got = entries.filter((e) => e.kind === "audio").length;

	for (const term of AUDIO_QUERIES) {
		if (got >= wanted) break;
		console.log(`Audio: "${term}" (${got}/${wanted})`);

		const params = new URLSearchParams({
			action: "query",
			format: "json",
			generator: "search",
			gsrnamespace: "6",
			gsrsearch: `${term} filetype:audio`,
			gsrlimit: "25",
			prop: "imageinfo",
			iiprop: "url|size|mime|mediatype|extmetadata",
		});
		const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { "User-Agent": UA } });
		if (!res.ok) {
			console.warn(`  Commons search failed (${res.status}); skipping "${term}"`);
			continue;
		}
		await sleep(400);
		const json = (await res.json()) as { query?: { pages?: Record<string, CommonsPage> } };
		const pages = Object.values(json.query?.pages ?? {});

		for (const page of pages) {
			if (got >= wanted) break;
			const info = page.imageinfo?.[0];
			if (!info) continue;
			const mime = AUDIO_MIME[info.mime];
			if (!mime || info.size > MAX_AUDIO_BYTES || info.size < 20_000) continue;

			const license = strip_html(info.extmetadata?.LicenseShortName?.value);
			if (!OK_LICENSE.test(license) || BAD_LICENSE.test(license)) continue;
			const artist = strip_html(info.extmetadata?.Artist?.value) || "Unknown";

			const id = `commons-${page.title.replace(/^File:/, "").replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 60)}`;
			if (have.has(id)) continue;

			const ext = mime === "audio/ogg" ? "ogg" : mime === "audio/mpeg" ? "mp3" : "wav";
			const rel = `audio/${id}.${ext}`;
			const dest = path.join(MEDIA_DIR, rel);
			const bytes = fs.existsSync(dest) ? fs.statSync(dest).size : await download(info.url, dest, MAX_AUDIO_BYTES);
			if (!bytes) continue;

			entries.push({
				id,
				kind: "audio",
				tags: ["musician"],
				file: rel,
				mime,
				bytes,
				source: "wikimedia",
				creator: artist,
				license,
				sourceUrl: info.descriptionurl,
				alt: `[${term}] ${page.title.replace(/^File:/, "")}`,
			});
			have.add(id);
			got += 1;
		}
		save_manifest(entries);
	}
}

function write_attribution(entries: ManifestEntry[]) {
	const lines = [
		"# Demo media attribution",
		"",
		"All media is real (nothing is AI-generated) and used under the licences below.",
		"Pixabay: https://pixabay.com/service/license-summary/ - Pexels: https://www.pexels.com/license/ - Wikimedia Commons audio: licence per file.",
		"",
		"| File | Creator | Licence | Source |",
		"| --- | --- | --- | --- |",
		...entries.map((e) => `| ${e.file} | ${e.creator.replace(/\|/g, "/")} | ${e.license} | ${e.sourceUrl} |`),
		"",
	];
	fs.writeFileSync(path.join(MEDIA_DIR, "ATTRIBUTION.md"), lines.join("\n"));
}

// ----------------------------------------------------------- Manual import --

// scripts/demo/media/import/<folder>/<files>
//   avatars-female, avatars-male  -> profile pictures (adults you are sure about)
//   painter, photographer, designer, musician, event -> work / event images,
//   plus .mp4 videos and .mp3/.ogg/.wav audio for that category.
const IMPORT_FOLDERS: Record<string, string[]> = {
	"avatars-female": ["avatar", "female"],
	"avatars-male": ["avatar", "male"],
	painter: ["painter"],
	photographer: ["photographer"],
	designer: ["designer"],
	musician: ["musician"],
	event: ["event"],
};
const IMPORT_EXT: Record<string, { kind: MediaKind; mime: string; dir: string; ext: string }> = {
	".jpg": { kind: "image", mime: "image/jpeg", dir: "images", ext: "jpg" },
	".jpeg": { kind: "image", mime: "image/jpeg", dir: "images", ext: "jpg" },
	".png": { kind: "image", mime: "image/png", dir: "images", ext: "png" },
	".webp": { kind: "image", mime: "image/webp", dir: "images", ext: "webp" },
	".mp4": { kind: "video", mime: "video/mp4", dir: "videos", ext: "mp4" },
	".mp3": { kind: "audio", mime: "audio/mpeg", dir: "audio", ext: "mp3" },
	".ogg": { kind: "audio", mime: "audio/ogg", dir: "audio", ext: "ogg" },
	".wav": { kind: "audio", mime: "audio/wav", dir: "audio", ext: "wav" },
};

function import_manual(entries: ManifestEntry[]) {
	const root = path.join(MEDIA_DIR, "import");
	if (!fs.existsSync(root)) {
		fs.mkdirSync(root, { recursive: true });
		for (const folder of Object.keys(IMPORT_FOLDERS)) fs.mkdirSync(path.join(root, folder), { recursive: true });
		console.log(`Created ${root} with the category folders. Drop your files in and re-run with --import.`);
		return;
	}
	const have = new Set(entries.map((e) => e.id));
	let added = 0;
	for (const [folder, tags] of Object.entries(IMPORT_FOLDERS)) {
		const dir = path.join(root, folder);
		if (!fs.existsSync(dir)) continue;
		for (const name of fs.readdirSync(dir)) {
			const spec = IMPORT_EXT[path.extname(name).toLowerCase()];
			if (!spec) continue;
			const slug = path.basename(name, path.extname(name)).replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 50);
			const id = `manual-${folder}-${slug}`;
			if (have.has(id)) continue;
			const isAvatar = tags.includes("avatar");
			const rel = `${isAvatar ? "avatars" : spec.dir}/${id}.${spec.ext}`;
			const dest = path.join(MEDIA_DIR, rel);
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.copyFileSync(path.join(dir, name), dest);
			entries.push({
				id,
				kind: spec.kind,
				tags: spec.kind === "image" ? tags : tags.filter((t) => t !== "avatar" && t !== "female" && t !== "male"),
				file: rel,
				mime: spec.mime,
				bytes: fs.statSync(dest).size,
				source: "manual",
				creator: "supplied by the team",
				license: "Supplied by the team (own or licensed files)",
				sourceUrl: "n/a",
				alt: `[manual] ${slug.replace(/_/g, " ")}`,
			});
			have.add(id);
			added += 1;
		}
	}
	save_manifest(entries);
	console.log(`Imported ${added} file(s) from ${root}`);
}

async function main() {
	const entries = load_manifest();
	const importMode = process.argv.includes("--import");

	if (importMode) import_manual(entries);

	if (PEXELS_KEY || PIXABAY_KEY) {
		console.log(`Photo/video provider: ${PEXELS_KEY ? "Pexels" : "Pixabay"}`);
		await fetch_photos(entries);
		await fetch_videos(entries);
	} else if (!importMode) {
		console.warn(
			"No PEXELS_API_KEY or PIXABAY_API_KEY set - skipping photos and videos.\n" +
				"  Free key (instant): https://pixabay.com/api/docs/  ->  PIXABAY_API_KEY=your_key npm run demo:media\n" +
				"  Or use your own files: npm run demo:media -- --import\n"
		);
	}

	await fetch_audio(entries);
	write_attribution(entries);

	const count = (kind: MediaKind, tag?: string) => entries.filter((e) => e.kind === kind && (!tag || e.tags.includes(tag))).length;
	console.log("\nDone.");
	console.log(`  avatars: ${count("image", "avatar")} (female ${count("image", "female")}, male ${count("image", "male")})`);
	console.log(`  images:  ${entries.filter((e) => e.kind === "image" && !e.tags.includes("avatar")).length}`);
	console.log(`  videos:  ${count("video")}`);
	console.log(`  audio:   ${count("audio")}`);
	console.log(`\nLook through scripts/demo/media/avatars and images before seeding - delete any file you don't like`);
	console.log("(and its entry in manifest.json), then run: npm run demo:wipe  ->  npm run demo:seed");
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
