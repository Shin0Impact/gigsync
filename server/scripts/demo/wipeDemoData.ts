// Cleans the database before the presentation.
//
//   npm run demo:wipe -- --keep=you@mail.com,jinad@mail.com,kareem@mail.com
//       DRY RUN: shows what would be deleted (runs everything in a
//       transaction and rolls it back). Nothing changes.
//
//   npm run demo:wipe -- --keep=a@x.com,b@y.com --confirm [--purge-r2]
//       Really deletes. Add --purge-r2 to also delete the matching files
//       from the Cloudflare R2 buckets.
//
//   npm run demo:wipe -- --demo-only --confirm
//       Only removes accounts created by the demo/dummy seeders
//       (@gigsync-demo.test, @gigsync-dummy.test) and their content.
//
// "Keep" mode (default): ALL content is deleted - posts, comments, likes,
// follows, events, applications, portfolios, conversations, messages - for
// everyone, including the accounts you keep. Every user NOT in --keep is
// deleted entirely (profile, role, tokens, ...). Kept accounts keep their
// login, profile, role, social links and verification.
//
// This cannot be undone. Take a backup first (Supabase dashboard -> Database
// -> Backups, or `pg_dump`).
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import type { PoolClient } from "pg";
import { pool } from "../../src/config/db";
import { r2Client } from "../../src/config/r2";
import { env } from "../../src/config/env";

const DEMO_EMAIL_PATTERNS = ["%@gigsync-demo.test", "%@gigsync-dummy.test"];

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

const CONFIRM = flag("confirm");
const DEMO_ONLY = flag("demo-only");
const PURGE_R2 = flag("purge-r2");
const KEEP = (value("keep") ?? "")
	.split(",")
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean);

interface UserRow {
	id: string;
	email: string;
	user_name: string | null;
	role: string | null;
}

const report: string[] = [];

async function run(client: PoolClient, label: string, sql: string, params: unknown[] = []): Promise<number> {
	const result = await client.query(sql, params);
	const n = result.rowCount ?? 0;
	report.push(`  ${label.padEnd(34)} ${n}`);
	return n;
}

// R2 object keys that the deleted rows point at (collected BEFORE deleting).
// contentIds = users whose posts/events go away (null = everyone's);
// userIds = users whose avatar / ID document go away.
async function collect_keys(client: PoolClient, contentIds: string[] | null, userIds: string[]) {
	const media = contentIds
		? await client.query<{ k: string }>(
				`SELECT um.r2_key AS k FROM update_media um
				 JOIN work_updates wu ON wu.id = um.update_id
				 JOIN works w ON w.id = wu.work_id WHERE w.user_id = ANY($1::uuid[])`,
				[contentIds],
			)
		: await client.query<{ k: string }>(`SELECT r2_key AS k FROM update_media`);
	const eventMedia = contentIds
		? await client.query<{ k: string }>(
				`SELECT em.object_key AS k FROM event_media em
				 JOIN event e ON e.id = em.event_id WHERE e.organizer_id = ANY($1::uuid[])`,
				[contentIds],
			)
		: await client.query<{ k: string }>(`SELECT object_key AS k FROM event_media`);
	const avatars = await client.query<{ k: string }>(
		`SELECT avatar_url AS k FROM profiles WHERE avatar_url IS NOT NULL AND user_id = ANY($1::uuid[])`,
		[userIds],
	);
	const idDocs = await client.query<{ k: string }>(
		`SELECT id_document_key AS k FROM verification_requests WHERE user_id = ANY($1::uuid[])`,
		[userIds],
	);
	const clean = (rows: { k: string }[]) => rows.map((r) => r.k).filter((k) => k && !/^https?:\/\//.test(k));
	return {
		media: Array.from(new Set([...clean(media.rows), ...clean(eventMedia.rows), ...clean(avatars.rows)])),
		idDocs: clean(idDocs.rows),
	};
}

// Everything that belongs to (or points at) the given users.
async function delete_users_and_their_content(client: PoolClient, ids: string[], includeContent: boolean) {
	if (ids.length === 0) return;

	if (includeContent) {
		const wk = `SELECT id FROM works WHERE user_id = ANY($1::uuid[])`;
		const ev = `SELECT id FROM event WHERE organizer_id = ANY($1::uuid[])`;
		const cv = `SELECT conversation_id FROM conversation_participants WHERE user_id = ANY($1::uuid[])`;

		await run(client, "messages", `DELETE FROM messages WHERE sender_id = ANY($1::uuid[]) OR conversation_id IN (${cv})`, [ids]);
		await run(client, "conversation_participants", `DELETE FROM conversation_participants WHERE conversation_id IN (${cv})`, [ids]);
		await run(client, "conversations", `DELETE FROM conversations c WHERE NOT EXISTS (SELECT 1 FROM conversation_participants p WHERE p.conversation_id = c.id)`);
		await run(client, "work_likes", `DELETE FROM work_likes WHERE user_id = ANY($1::uuid[]) OR work_id IN (${wk})`, [ids]);
		await run(client, "work_comments", `DELETE FROM work_comments WHERE user_id = ANY($1::uuid[]) OR work_id IN (${wk})`, [ids]);
		await run(client, "update_media", `DELETE FROM update_media WHERE update_id IN (SELECT id FROM work_updates WHERE work_id IN (${wk}))`, [ids]);
		await run(client, "work_updates", `DELETE FROM work_updates WHERE work_id IN (${wk})`, [ids]);
		await run(
			client,
			"showcase_items",
			`DELETE FROM showcase_items WHERE user_id = ANY($1::uuid[]) OR work_id IN (${wk}) OR event_id IN (${ev})`,
			[ids],
		);
		await run(client, "event_applications", `DELETE FROM event_applications WHERE artist_id = ANY($1::uuid[]) OR event_id IN (${ev})`, [ids]);
		await run(client, "event_media", `DELETE FROM event_media WHERE event_id IN (${ev})`, [ids]);
		await run(client, "works", `DELETE FROM works WHERE user_id = ANY($1::uuid[])`, [ids]);
		await client.query(`UPDATE event SET parent_event_id = NULL WHERE parent_event_id IN (${ev}) OR organizer_id = ANY($1::uuid[])`, [ids]);
		await run(client, "event", `DELETE FROM event WHERE organizer_id = ANY($1::uuid[])`, [ids]);
		await run(client, "followings", `DELETE FROM followings WHERE user_id = ANY($1::uuid[]) OR followed_id = ANY($1::uuid[])`, [ids]);
	}

	await run(client, "artist_availability", `DELETE FROM artist_availability WHERE user_id = ANY($1::uuid[])`, [ids]);
	await run(client, "social_links", `DELETE FROM social_links WHERE user_id = ANY($1::uuid[])`, [ids]);
	await client.query(`UPDATE verification_requests SET reviewed_by = NULL WHERE reviewed_by = ANY($1::uuid[])`, [ids]);
	await run(client, "verification_requests", `DELETE FROM verification_requests WHERE user_id = ANY($1::uuid[])`, [ids]);
	await run(client, "auth_tokens", `DELETE FROM auth_tokens WHERE user_id = ANY($1::uuid[])`, [ids]);
	await run(client, "roles", `DELETE FROM roles WHERE user_id = ANY($1::uuid[])`, [ids]);
	await run(client, "profiles", `DELETE FROM profiles WHERE user_id = ANY($1::uuid[])`, [ids]);
	await run(client, "users", `DELETE FROM users WHERE id = ANY($1::uuid[])`, [ids]);
}

// "Keep" mode: wipe every piece of content, then the non-kept users.
async function wipe_all_content(client: PoolClient) {
	await run(client, "messages", `DELETE FROM messages`);
	await run(client, "conversation_participants", `DELETE FROM conversation_participants`);
	await run(client, "conversations", `DELETE FROM conversations`);
	await run(client, "work_likes", `DELETE FROM work_likes`);
	await run(client, "work_comments", `DELETE FROM work_comments`);
	await run(client, "update_media", `DELETE FROM update_media`);
	await run(client, "work_updates", `DELETE FROM work_updates`);
	await run(client, "showcase_items", `DELETE FROM showcase_items`);
	await run(client, "event_applications", `DELETE FROM event_applications`);
	await run(client, "event_media", `DELETE FROM event_media`);
	await run(client, "works", `DELETE FROM works`);
	await client.query(`UPDATE event SET parent_event_id = NULL`);
	await run(client, "event", `DELETE FROM event`);
	await run(client, "followings", `DELETE FROM followings`);
	await run(client, "profiles: followers reset", `UPDATE profiles SET followers_number = 0`);
}

async function main() {
	if (!DEMO_ONLY && KEEP.length === 0) {
		console.error("Refusing to run without --keep=email1,email2,... (the accounts to preserve) or --demo-only.");
		process.exit(1);
	}

	const host = new URL(env.databaseUrl).host;
	console.log(`Database: ${host}`);
	console.log(CONFIRM ? "MODE: LIVE - changes will be committed\n" : "MODE: dry run - nothing will be changed\n");

	const client = await pool.connect();
	try {
		const { rows: users } = await client.query<UserRow>(
			`SELECT u.id, u.email, p.user_name, r.role::text AS role
			 FROM users u
			 LEFT JOIN profiles p ON p.user_id = u.id
			 LEFT JOIN roles r ON r.user_id = u.id
			 ORDER BY u.created_at`,
		);

		let doomed: UserRow[];
		let kept: UserRow[];
		if (DEMO_ONLY) {
			const isDemo = (email: string) => DEMO_EMAIL_PATTERNS.some((p) => email.toLowerCase().endsWith(p.slice(1)));
			doomed = users.filter((u) => isDemo(u.email));
			kept = users.filter((u) => !isDemo(u.email));
		} else {
			const missing = KEEP.filter((k) => !users.some((u) => u.email.toLowerCase() === k));
			if (missing.length > 0) {
				console.error(`These --keep emails do not exist: ${missing.join(", ")}\nExisting accounts:`);
				for (const u of users) console.error(`  ${u.email}  (${u.user_name ?? "-"})`);
				process.exit(1);
			}
			kept = users.filter((u) => KEEP.includes(u.email.toLowerCase()));
			doomed = users.filter((u) => !KEEP.includes(u.email.toLowerCase()));
		}

		console.log(`KEEPING ${kept.length} account(s):`);
		for (const u of kept) console.log(`  ${u.email}  @${u.user_name ?? "-"}  ${u.role ?? ""}`);
		console.log(`\nDELETING ${doomed.length} account(s):`);
		for (const u of doomed.slice(0, 60)) console.log(`  ${u.email}  @${u.user_name ?? "-"}  ${u.role ?? ""}`);
		if (doomed.length > 60) console.log(`  ... and ${doomed.length - 60} more`);

		const doomedIds = doomed.map((u) => u.id);
		const { media: allMediaKeys, idDocs: idDocKeys } = await collect_keys(client, DEMO_ONLY ? doomedIds : null, doomedIds);

		await client.query("BEGIN");
		report.length = 0;
		if (DEMO_ONLY) {
			await delete_users_and_their_content(client, doomedIds, true);
			await run(
				client,
				"followers_number recalculated",
				`UPDATE profiles p SET followers_number = (SELECT count(*) FROM followings f WHERE f.followed_id = p.user_id)`,
			);
		} else {
			await wipe_all_content(client);
			await delete_users_and_their_content(client, doomedIds, false);
		}
		console.log("\nRows affected:");
		console.log(report.join("\n"));

		if (!CONFIRM) {
			await client.query("ROLLBACK");
			console.log(`\nDry run only. ${allMediaKeys.length} media file(s) in R2 would be orphaned (add --purge-r2 to delete them).`);
			console.log("Re-run with --confirm to apply.");
			return;
		}

		await client.query("COMMIT");
		console.log("\nCommitted.");

		if (PURGE_R2) {
			const purge = async (bucket: string, list: string[]) => {
				if (!bucket || list.length === 0) return;
				for (let i = 0; i < list.length; i += 1000) {
					const batch = list.slice(i, i + 1000);
					await r2Client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true } }));
				}
				console.log(`Deleted ${list.length} object(s) from ${bucket}`);
			};
			await purge(env.r2.bucketName, allMediaKeys);
			await purge(env.r2.idDocumentsBucketName, idDocKeys);
		} else {
			fs.mkdirSync(path.resolve(__dirname, "out"), { recursive: true });
			const listFile = path.resolve(__dirname, "out/orphaned-r2-keys.txt");
			fs.writeFileSync(listFile, allMediaKeys.join("\n"));
			console.log(`Left ${allMediaKeys.length} file(s) in R2. Their keys are in ${listFile} if you want to delete them from the R2 dashboard.`);
		}
	} catch (error) {
		await client.query("ROLLBACK").catch(() => undefined);
		throw error;
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
