// One-off seed script for testing GET /api/artists/search (card #24) -
// NOT part of the app itself, never imported by server code. Run it
// yourself from the server/ folder:
//
//   npx tsx scripts/seedDummyArtists.ts
//
// It goes through the same create_user -> create_role -> create_profile
// path register_user (auth.service.ts) uses, so these are real,
// loggable-in accounts, then sets location/followers/emergency-
// availability directly (there's no public endpoint for "set my follower
// count", so that part is a raw UPDATE). Every dummy account's email ends
// in @gigsync-dummy.test and every username starts with dummy_artist_,
// specifically so removeDummyArtists.ts (same folder) can find and
// delete all of them later without touching anything real.
import bcrypt from "bcrypt";
import { pool } from "../src/config/db";
import { create_user } from "../src/db/queries/users.queries";
import { create_profile } from "../src/db/queries/profiles.queries";
import { create_role } from "../src/db/queries/roles.queries";
import type { ArtistCategory } from "../src/types";

// Centered on Haifa, Israel (where this session's own testing landed -
// see the reverse-geocoded "32.697, 35.290" from the search page) so a
// default 25km-radius search immediately has something to find. lat/lng
// offsets below are in degrees, roughly 1 degree latitude = 111km, so the
// distances noted per artist are approximate, not exact.
const CENTER = { lat: 32.6996, lng: 35.2898 };

const DUMMY_PASSWORD = "DummyPass123!";

interface DummyArtist {
	userName: string;
	name: string;
	artistsType: ArtistCategory;
	// Degrees offset from CENTER.
	latOffset: number;
	lngOffset: number;
	followersNumber: number;
	isEmergencyAvailable: boolean;
}

// A spread of distances (very close to well outside the default 25km
// radius), categories, follower counts, and availability so the radius
// slider, category filter, and both sort modes all have something to
// show. ~0.009 degrees =~ 1km at this latitude.
const DUMMY_ARTISTS: DummyArtist[] = [
	{ userName: "dummy_artist_01", name: "Dana Cohen", artistsType: "painter", latOffset: 0.005, lngOffset: -0.004, followersNumber: 340, isEmergencyAvailable: true },
	{ userName: "dummy_artist_02", name: "Omar Haddad", artistsType: "photographer", latOffset: -0.012, lngOffset: 0.018, followersNumber: 1280, isEmergencyAvailable: false },
	{ userName: "dummy_artist_03", name: "Lior Ben-David", artistsType: "musician", latOffset: 0.03, lngOffset: 0.02, followersNumber: 52, isEmergencyAvailable: true },
	{ userName: "dummy_artist_04", name: "Maya Peretz", artistsType: "designer", latOffset: -0.025, lngOffset: -0.03, followersNumber: 870, isEmergencyAvailable: false },
	{ userName: "dummy_artist_05", name: "Noa Shapiro", artistsType: "painter", latOffset: 0.07, lngOffset: -0.05, followersNumber: 15, isEmergencyAvailable: false },
	{ userName: "dummy_artist_06", name: "Yusuf Khalil", artistsType: "musician", latOffset: -0.06, lngOffset: 0.06, followersNumber: 4200, isEmergencyAvailable: true },
	{ userName: "dummy_artist_07", name: "Tamar Avraham", artistsType: "photographer", latOffset: 0.1, lngOffset: 0.08, followersNumber: 610, isEmergencyAvailable: false },
	{ userName: "dummy_artist_08", name: "Itai Golan", artistsType: "designer", latOffset: -0.09, lngOffset: -0.1, followersNumber: 95, isEmergencyAvailable: true },
	{ userName: "dummy_artist_09", name: "Rana Mansour", artistsType: "musician", latOffset: 0.18, lngOffset: 0.15, followersNumber: 230, isEmergencyAvailable: false },
	{ userName: "dummy_artist_10", name: "Gal Nahum", artistsType: "painter", latOffset: -0.2, lngOffset: 0.19, followersNumber: 1890, isEmergencyAvailable: false },
	// Deliberately outside a 25km radius (~0.3+ deg) to make the radius
	// slider actually do something during testing.
	{ userName: "dummy_artist_11", name: "Shiraz Amar", artistsType: "photographer", latOffset: 0.35, lngOffset: -0.28, followersNumber: 72, isEmergencyAvailable: true },
	{ userName: "dummy_artist_12", name: "Fadi Qasem", artistsType: "designer", latOffset: -0.4, lngOffset: 0.33, followersNumber: 410, isEmergencyAvailable: false },
];

async function main() {
	const password_hash = await bcrypt.hash(DUMMY_PASSWORD, 12);

	for (const artist of DUMMY_ARTISTS) {
		const email = `${artist.userName}@gigsync-dummy.test`;
		const lat = CENTER.lat + artist.latOffset;
		const lng = CENTER.lng + artist.lngOffset;

		const client = await pool.connect();
		try {
			await client.query("BEGIN");

			const user = await create_user(client, email, password_hash);
			await create_role(client, user.id, "artist");
			await create_profile(client, user.id, artist.userName, artist.artistsType);

			// create_profile/create_role don't take location, follower count,
			// or emergency availability - those aren't set at signup in the
			// real app (location comes from the emergency-availability toggle
			// later, followers accrue from being followed), so this fills
			// them in directly for test data.
			await client.query(
				`
					UPDATE profiles
					SET
						name = $1,
						followers_number = $2,
						is_emergency_available = $3,
						location = ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography
					WHERE user_id = $6
				`,
				[artist.name, artist.followersNumber, artist.isEmergencyAvailable, lng, lat, user.id],
			);

			await client.query("COMMIT");
			// eslint-disable-next-line no-console
			console.log(`Created ${artist.userName} (${artist.artistsType}) at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
		} catch (error) {
			await client.query("ROLLBACK");
			const message = error instanceof Error ? error.message : String(error);
			// A re-run after a partial failure shouldn't blow up on rows that
			// already exist - report and move on to the next artist instead.
			// eslint-disable-next-line no-console
			console.error(`Skipped ${artist.userName}: ${message}`);
		} finally {
			client.release();
		}
	}

	await pool.end();
	// eslint-disable-next-line no-console
	console.log("\nDone. Log in as any dummy_artist_NN@gigsync-dummy.test with password:", DUMMY_PASSWORD);
	// eslint-disable-next-line no-console
	console.log("Run scripts/removeDummyArtists.ts to delete all of them again.");
}

main().catch((error) => {
	// eslint-disable-next-line no-console
	console.error(error);
	process.exit(1);
});
