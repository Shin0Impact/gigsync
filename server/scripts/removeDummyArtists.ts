// Deletes every account seedDummyArtists.ts created (anything with an
// email ending in @gigsync-dummy.test), and nothing else. Run from
// server/:
//
//   npx tsx scripts/removeDummyArtists.ts
//
// Deletes roles and profiles explicitly before users rather than relying
// on an ON DELETE CASCADE that may or may not be set up on the live
// database - this works either way.
import { pool } from "../src/config/db";

const DUMMY_EMAIL_SUFFIX = "@gigsync-dummy.test";

async function main() {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const { rows: users } = await client.query<{ id: string; email: string }>(
			`SELECT id, email FROM users WHERE email LIKE $1`,
			[`%${DUMMY_EMAIL_SUFFIX}`],
		);

		if (users.length === 0) {
			// eslint-disable-next-line no-console
			console.log("No dummy artists found - nothing to delete.");
			await client.query("ROLLBACK");
			return;
		}

		const userIds = users.map((u) => u.id);

		await client.query(`DELETE FROM roles WHERE user_id = ANY($1::uuid[])`, [userIds]);
		await client.query(`DELETE FROM profiles WHERE user_id = ANY($1::uuid[])`, [userIds]);
		await client.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [userIds]);

		await client.query("COMMIT");
		// eslint-disable-next-line no-console
		console.log(`Deleted ${users.length} dummy artist(s):`, users.map((u) => u.email).join(", "));
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((error) => {
	// eslint-disable-next-line no-console
	console.error(error);
	process.exit(1);
});
