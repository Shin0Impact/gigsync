# Presentation demo data

Replaces the random test data with a believable community: ~50 users with real
profile photos, ~150 posts with real photos / videos / audio, comments, likes,
follows, ~20 events (2 urgent) with applications, portfolios, availability and
chats. **Nothing is AI-generated** - photos and videos come from Pixabay (or Pexels,
or your own files), audio from Wikimedia Commons (CC0 / public domain / CC BY / CC BY-SA).

Run everything from `server/`. The scripts use the repo-root `.env`
(`DATABASE_URL`, `R2_*`), so run them on a machine that can reach Supabase and R2.

## 1. Get real media (needs internet)

Pexels is currently not issuing keys, so use Pixabay (free, key is instant):
sign up at <https://pixabay.com/api/docs/> and copy your key, then:

```bash
PIXABAY_API_KEY=your_key npm run demo:media     # or put PIXABAY_API_KEY=... in the root .env
```

(If you already have a Pexels key, `PEXELS_API_KEY` works too and takes priority.)

**Your own files:** `npm run demo:media -- --import` creates
`scripts/demo/media/import/` with folders `avatars-female`, `avatars-male`,
`painter`, `photographer`, `designer`, `musician`, `event`. Drop jpg/png/webp,
mp4 and mp3/ogg/wav files in, run the command again, and they join the manifest.
Best for profile pictures you are sure about. Audio always comes from Wikimedia
Commons (no key).

Downloads into `scripts/demo/media/` (git-ignored) and writes `manifest.json`
plus `ATTRIBUTION.md` (creator + licence for every file). Safe to re-run; it
tops up what's missing. **Open `media/avatars/` and `media/images/` and delete any
photo you don't like** (also remove its entry from `manifest.json`). Portraits are
filtered to adults, but eyeball them anyway.

Pixabay allows 100 requests/minute and Pexels 200/hour; if you hit a limit, wait and re-run.

## 2. Clean the database (irreversible!)

Back up first (Supabase dashboard -> Database -> Backups).

```bash
# dry run - shows exactly what would be deleted, changes nothing
npm run demo:wipe -- --keep=you@mail.com,jinad@mail.com,kareem@mail.com

# for real (add --purge-r2 to also delete the files from the R2 bucket)
npm run demo:wipe -- --keep=you@mail.com,jinad@mail.com,kareem@mail.com --confirm --purge-r2
```

`--keep` mode deletes ALL content (posts, comments, likes, follows, events,
applications, portfolios, chats) and every account not listed. Kept accounts keep
their login, profile and role. If a `--keep` email doesn't exist the script lists
the real accounts and stops.

Later, to remove only the demo accounts again (and their content):

```bash
npm run demo:wipe -- --demo-only --confirm --purge-r2
```

## 3. Seed

Run the SQL in `src/db/migrations/2026-10-15_event_search_and_urgent.sql` first
(adds `event.is_urgent` - the seeder writes it).

```bash
npm run demo:seed -- --plan-only    # preview counts, touches nothing
npm run demo:seed                   # uploads media to R2, then inserts everything
```

All demo accounts use `@gigsync-demo.test` emails and the password
`DemoPass123!`; the full list is written to `scripts/demo/out/demo-accounts.csv`.
The seeder refuses to run if demo accounts already exist (wipe with `--demo-only` first).

## Notes

- Audio is `.ogg`/`.mp3`/`.wav`; Chrome and Firefox play ogg, Safari does not.
- Locations are around Haifa, Tel Aviv, Jerusalem, Nazareth, Akko, Beersheba,
  Netanya and Tiberias, so the nearby-artist and event search work out of the box.
- The same media folder always produces the same dataset (seeded randomness).
- Don't commit `media/` (it's git-ignored). Credit Pexels / the Wikimedia authors
  in the presentation if you show the photos (see `ATTRIBUTION.md`).
