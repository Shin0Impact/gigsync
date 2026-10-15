// Fills the availability calendar for performers (artists) so the
// "available on" views and booking flows look alive in the demo.
//
//   npm run demo:availability                    # all artists, next 60 days, adds to what exists
//   npm run demo:availability -- --demo-only     # only @gigsync-demo.test artists
//   npm run demo:availability -- --replace       # clear their upcoming days first, then refill
//   npm run demo:availability -- --days=90
//
// Each artist gets a pattern (mostly Thu-Sat, mostly Sun-Wed, or flexible), so
// calendars look different from one another. Safe to re-run.
import { pool } from "../../src/config/db";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

const DAYS = Math.min(Math.max(Number(value("days") ?? 60) || 60, 7), 365);
const DEMO_ONLY = flag("demo-only");
const REPLACE = flag("replace");

// Israeli week: Thu/Fri/Sat are the gig days.
const PATTERNS: { name: string; chance: (weekday: number) => number }[] = [
	{ name: "weekends", chance: (d) => ([4, 5, 6].includes(d) ? 0.85 : 0.1) },
	{ name: "weekdays", chance: (d) => ([0, 1, 2, 3].includes(d) ? 0.7 : 0.15) },
	{ name: "flexible", chance: () => 0.55 },
	{ name: "busy", chance: () => 0.25 },
];

function date_string(offsetDays: number): string {
	const now = new Date();
	const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays));
	return d.toISOString().slice(0, 10);
}

async function main() {
	const { rows: artists } = await pool.query<{ user_id: string; user_name: string }>(
		`SELECT p.user_id, p.user_name
		   FROM profiles p
		   JOIN roles r ON r.user_id = p.user_id AND r.role = 'artist'
		   JOIN users u ON u.id = p.user_id
		  WHERE ($1::boolean = false OR u.email LIKE '%@gigsync-demo.test')
		  ORDER BY p.user_name`,
		[DEMO_ONLY],
	);
	if (artists.length === 0) {
		console.log("No artists found.");
		return;
	}

	const client = await pool.connect();
	let total = 0;
	try {
		await client.query("BEGIN");
		if (REPLACE) {
			await client.query(`DELETE FROM artist_availability WHERE user_id = ANY($1::uuid[]) AND available_date >= $2::date`, [artists.map((a) => a.user_id), date_string(0)]);
		}
		for (const artist of artists) {
			const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
			const dates: string[] = [];
			for (let i = 1; i <= DAYS; i++) {
				const s = date_string(i);
				const weekday = new Date(`${s}T00:00:00Z`).getUTCDay();
				if (Math.random() < pattern.chance(weekday)) dates.push(s);
			}
			if (dates.length === 0) continue;
			await client.query(
				`INSERT INTO artist_availability (user_id, available_date)
				 SELECT $1::uuid, unnest($2::date[])
				 ON CONFLICT (user_id, available_date) DO NOTHING`,
				[artist.user_id, dates],
			);
			total += dates.length;
			console.log(`  ${artist.user_name.padEnd(24)} ${pattern.name.padEnd(9)} ${dates.length} days`);
		}
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
	console.log(`\nDone: ${artists.length} artists, ${total} availability days over the next ${DAYS} days.`);
	await pool.end();
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
