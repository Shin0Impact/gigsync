// Tops up existing posts (works) so each one has several intermezzi (updates),
// each with real media, plus a few likes/comments inside each new window so the
// Composition view on the piece page shows activity per version.
//
//   npm run demo:intermezzi                    # every post gets up to 3-5 intermezzi
//   npm run demo:intermezzi -- --min=4         # at least 4 per post
//   npm run demo:intermezzi -- --demo-only     # only posts by @gigsync-demo.test artists
//   npm run demo:intermezzi -- --dry-run       # show what would be added
//
// Needs `npm run demo:media` to have been run. Safe to re-run: posts that already
// have enough intermezzi are left alone.
import { pool } from "../../src/config/db";
import { COMMENTS_BY_CATEGORY, COMMENTS_GENERAL, UPDATE_NOTES, type Category } from "./content";
import type { ManifestEntry } from "./fetchDemoMedia";
import { load_manifest, media_key, seeded_rng, upload } from "./lib";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const DEMO_ONLY = args.includes("--demo-only");
const MIN_ARG = Number(args.find((a) => a.startsWith("--min="))?.split("=")[1]);
const MIN = Number.isInteger(MIN_ARG) && MIN_ARG >= 2 ? Math.min(MIN_ARG, 8) : null;

const DAY = 86_400_000;
const HOUR = 3_600_000;
const NOW = Date.now();
const rand = seeded_rng(20261016);
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => arr.map((v) => [rand(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

const manifest = load_manifest();
const usage = new Map<string, number>();
const CATS: Category[] = ["painter", "photographer", "designer", "musician"];

function take(candidates: ManifestEntry[], count: number): ManifestEntry[] {
	const chosen = shuffle(candidates)
		.sort((a, b) => (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0))
		.slice(0, count);
	for (const e of chosen) usage.set(e.id, (usage.get(e.id) ?? 0) + 1);
	return chosen;
}

function media_for(category: Category): ManifestEntry[] {
	const imgs = manifest.filter((e) => e.kind === "image" && e.tags.includes(category) && !e.tags.includes("avatar"));
	const vids = manifest.filter((e) => e.kind === "video" && e.tags.includes(category));
	const auds = manifest.filter((e) => e.kind === "audio");
	const roll = rand();
	let out: ManifestEntry[] = [];
	if (category === "musician") {
		if (roll < 0.35 && auds.length) out = take(auds, 1);
		else if (roll < 0.65 && vids.length) out = take(vids, 1);
		else out = take(imgs, 1);
	} else if (roll < 0.2 && vids.length) {
		out = take(vids, 1);
	} else {
		out = take(imgs, rand() < 0.35 ? 2 : 1);
	}
	return out.length ? out : take(manifest.filter((e) => e.kind === "image" && !e.tags.includes("avatar")), 1);
}

interface WorkRow {
	id: number;
	owner_id: string;
	title: string | null;
	category: Category | null;
	update_count: number;
	last_update_at: Date;
	last_version: number;
}

async function main() {
	const { rows: works } = await pool.query<WorkRow>(
		`SELECT w.id, w.user_id AS owner_id, w.title, p.artists_type::text AS category,
		        (SELECT count(*) FROM work_updates u WHERE u.work_id = w.id)::int AS update_count,
		        COALESCE((SELECT max(u.created_at) FROM work_updates u WHERE u.work_id = w.id), w.created_at) AS last_update_at,
		        COALESCE((SELECT max(u.version_number) FROM work_updates u WHERE u.work_id = w.id), 0)::int AS last_version
		   FROM works w
		   JOIN users usr ON usr.id = w.user_id
		   LEFT JOIN profiles p ON p.user_id = w.user_id
		  WHERE ($1::boolean = false OR usr.email LIKE '%@gigsync-demo.test')
		  ORDER BY w.id`,
		[DEMO_ONLY],
	);

	const { rows: people } = await pool.query<{ id: string }>(`SELECT u.id FROM users u JOIN roles r ON r.user_id = u.id`);
	const peopleIds = people.map((p) => p.id);

	const plan = works
		.map((w) => {
			const target = MIN ?? int(3, 5);
			return { work: w, add: Math.max(0, target - w.update_count) };
		})
		.filter((p) => p.add > 0);

	console.log(`${works.length} posts, ${plan.length} to top up, ${plan.reduce((n, p) => n + p.add, 0)} intermezzi to add${DRY ? " (dry run)" : ""}`);
	if (plan.length === 0 || DRY) return;

	let added = 0;
	let mediaRows = 0;
	let likeRows = 0;
	let commentRows = 0;

	for (const { work, add } of plan) {
		const category: Category = work.category && (CATS as string[]).includes(work.category) ? (work.category as Category) : "painter";
		const start = new Date(work.last_update_at).getTime();
		const room = NOW - 10 * 60_000 - start;
		if (room < HOUR * 2) continue; // nothing sensible to add after a brand-new post
		// spread the new updates out after the last one, never into the future
		const step = Math.min(int(1, 4) * DAY, Math.floor(room / (add + 1)));

		const client = await pool.connect();
		try {
			await client.query("BEGIN");
			let version = work.last_version;
			const windows: { from: number; to: number }[] = [];
			const notes = shuffle(UPDATE_NOTES);

			for (let i = 0; i < add; i += 1) {
				const when = Math.min(NOW - 10 * 60_000, start + step * (i + 1) + int(0, 5) * HOUR);
				const entries = media_for(category);
				for (const e of entries) await upload(e);
				version += 1;
				const { rows } = await client.query<{ id: number }>(
					`INSERT INTO work_updates (work_id, version_number, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) RETURNING id`,
					[work.id, version, notes[i % notes.length], new Date(when).toISOString()],
				);
				let order = 0;
				for (const m of entries) {
					await client.query(
						`INSERT INTO update_media (update_id, media_type, r2_key, mime_type, file_size, sort_order, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
						[rows[0].id, m.kind, media_key(m), m.mime, m.bytes, order, new Date(when).toISOString()],
					);
					order += 1;
					mediaRows += 1;
				}
				windows.push({ from: when, to: when + Math.max(step, 6 * HOUR) });
				added += 1;
			}

			// likes + comments inside each new window (drives the Composition bars)
			const others = peopleIds.filter((id) => id !== work.owner_id);
			const { rows: existingLikes } = await client.query<{ user_id: string }>(`SELECT user_id FROM work_likes WHERE work_id = $1`, [work.id]);
			const liked = new Set(existingLikes.map((r) => r.user_id));
			for (const win of windows) {
				const ts = () => new Date(Math.min(NOW - 60_000, win.from + int(5, 600) * 60_000)).toISOString();
				for (const id of shuffle(others).filter((id) => !liked.has(id)).slice(0, int(1, 4))) {
					liked.add(id);
					await client.query(`INSERT INTO work_likes (work_id, user_id, created_at) VALUES ($1, $2, $3)`, [work.id, id, ts()]);
					likeRows += 1;
				}
				for (const id of shuffle(others).slice(0, int(0, 2))) {
					const text = pick(rand() < 0.5 ? COMMENTS_BY_CATEGORY[category] : COMMENTS_GENERAL);
					const when = ts();
					await client.query(`INSERT INTO work_comments (work_id, user_id, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $4)`, [work.id, id, text, when]);
					commentRows += 1;
				}
			}

			await client.query(`UPDATE works SET updated_at = $2 WHERE id = $1`, [work.id, new Date(windows[windows.length - 1].from).toISOString()]);
			await client.query("COMMIT");
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}

	console.log(`\nDone: ${added} intermezzi, ${mediaRows} media files, ${likeRows} likes, ${commentRows} comments added.`);
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(() => pool.end());
