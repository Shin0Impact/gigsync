// Small helpers shared by the top-up scripts (fillEventCovers, addIntermezzi).
import fs from "fs";
import path from "path";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "../../src/config/r2";
import { env } from "../../src/config/env";
import type { ManifestEntry } from "./fetchDemoMedia";

export const MEDIA_DIR = path.resolve(__dirname, "media");

export function load_manifest(): ManifestEntry[] {
	const file = path.join(MEDIA_DIR, "manifest.json");
	if (!fs.existsSync(file)) {
		console.error("No media found. Run `npm run demo:media` first (see scripts/demo/README.md).");
		process.exit(1);
	}
	return (JSON.parse(fs.readFileSync(file, "utf8")) as ManifestEntry[]).filter((e) => fs.existsSync(path.join(MEDIA_DIR, e.file)));
}

// Same key scheme as seedDemoData.ts, so files already uploaded by the seed are reused.
export const media_key = (e: ManifestEntry) => `demo/${e.kind}/${path.basename(e.file)}`;

const uploaded = new Set<string>();

export async function upload(entry: ManifestEntry): Promise<void> {
	if (uploaded.has(entry.id)) return;
	const Key = media_key(entry);
	const file = path.join(MEDIA_DIR, entry.file);
	const size = fs.statSync(file).size;
	try {
		const head = await r2Client.send(new HeadObjectCommand({ Bucket: env.r2.bucketName, Key }));
		if (head.ContentLength === size) {
			uploaded.add(entry.id);
			return;
		}
	} catch {
		// not uploaded yet
	}
	await r2Client.send(new PutObjectCommand({ Bucket: env.r2.bucketName, Key, Body: fs.readFileSync(file), ContentType: entry.mime, ContentLength: size }));
	uploaded.add(entry.id);
}

export const strip_query_tag = (alt: string) => alt.replace(/^\[[^\]]*\]\s*/, "");

export function seeded_rng(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s + 0x6d2b79f5) >>> 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
