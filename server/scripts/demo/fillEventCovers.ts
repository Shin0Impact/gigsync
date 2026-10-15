// Gives every existing event without a photo a real cover image (from the
// downloaded demo media), so Discovery cards and event pages aren't empty.
//
//   npm run demo:covers                 # events that have no image yet
//   npm run demo:covers -- --replace    # re-pick the cover for ALL events
//   npm run demo:covers -- --dry-run    # show what would happen
//
// Needs `npm run demo:media` to have been run (uses the "event" photos, with the
// other category photos as fallback). Files are uploaded to R2 under demo/image/.
import { pool } from "../../src/config/db";
import { load_manifest, media_key, seeded_rng, strip_query_tag, upload } from "./lib";

const args = process.argv.slice(2);
const REPLACE = args.includes("--replace");
const DRY = args.includes("--dry-run");

const KEYWORDS: Record<string, RegExp> = {
	musician: /music|stage|mic|band|concert|singer|guitar|piano|drum|sax|violin/i,
	painter: /gallery|exhibit|paint|mural|art/i,
	photographer: /gallery|exhibit|photo|concert|street/i,
	designer: /workshop|studio|mural|poster|design|gallery/i,
};

async function main() {
	const manifest = load_manifest();
	const eventImages = manifest.filter((e) => e.kind === "image" && e.tags.includes("event"));
	const fallback = manifest.filter((e) => e.kind === "image" && !e.tags.includes("avatar"));
	const pool_ = eventImages.length > 0 ? eventImages : fallback;
	if (pool_.length === 0) {
		console.error("No photos in the manifest. Run `npm run demo:media` first.");
		process.exit(1);
	}

	const { rows: events } = await pool.query<{ id: number; title: string; categories: string[] | null; has_image: boolean }>(
		`SELECT e.id, e.title, e.categories_needed::text[] AS categories,
		        EXISTS (SELECT 1 FROM event_media m WHERE m.event_id = e.id AND m.media_type = 'image') AS has_image
		   FROM event e ORDER BY e.id`,
	);
	const targets = events.filter((e) => REPLACE || !e.has_image);
	console.log(`${events.length} events, ${targets.length} to update${DRY ? " (dry run)" : ""}`);
	if (targets.length === 0) return;

	const rand = seeded_rng(20261015);
	const used = new Map<string, number>();
	let done = 0;

	for (const event of targets) {
		const wanted = (event.categories ?? []).map((c) => KEYWORDS[c]).filter(Boolean);
		const scored = pool_
			.map((entry) => ({
				entry,
				score: (wanted.some((re) => re.test(entry.alt)) ? 2 : 0) - (used.get(entry.id) ?? 0) + rand() * 0.9,
			}))
			.sort((a, b) => b.score - a.score);
		const pick = scored[0].entry;
		used.set(pick.id, (used.get(pick.id) ?? 0) + 1);

		console.log(`  #${event.id} ${event.title.slice(0, 40).padEnd(40)} <- ${pick.file}`);
		if (DRY) continue;

		await upload(pick);
		const client = await pool.connect();
		try {
			await client.query("BEGIN");
			if (REPLACE) await client.query(`DELETE FROM event_media WHERE event_id = $1 AND media_type = 'image'`, [event.id]);
			// sort_order -1 so the new cover is always the first image
			await client.query(`INSERT INTO event_media (event_id, media_type, object_key, alt_text, sort_order) VALUES ($1, 'image', $2, $3, -1)`, [
				event.id,
				media_key(pick),
				strip_query_tag(pick.alt).slice(0, 200) || event.title,
			]);
			await client.query("COMMIT");
			done += 1;
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}
	console.log(`\nDone: ${done} cover image(s) added.`);
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(() => pool.end());
