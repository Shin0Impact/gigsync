import { useState } from "react";
import { Link } from "react-router-dom";
import { useSearchArtistsQuery } from "../features/artists/artistsApi";
import { LocationPicker } from "../features/artists/components/LocationPicker";
import ProfilePicture from "../components/user/ProfilePicture";
import { ROUTES } from "../routes/routePaths";
import type { ArtistCategory } from "@shared/types/index";
import styles from "./ArtistSearchPage.module.css";

const ARTIST_CATEGORIES: ArtistCategory[] = ["painter", "photographer", "designer", "musician"];

// Arbitrary starting point (NYC) for anyone who hasn't picked a spot or
// granted geolocation yet - just a default center for the map, not a
// search that fires on its own (see hasPickedLocation below).
const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

// Card #24 - the "Use my location"/click-the-map frontend for
// GET /api/artists/search. The query only ever fires once a location has
// actually been picked (click, drag, or "Use my location"), not on the
// unpicked default center - searching from a point nobody chose would be
// a confusing default experience.
export function ArtistSearchPage() {
	const [center, setCenter] = useState(DEFAULT_CENTER);
	const [radiusKm, setRadiusKm] = useState(25);
	const [artistsType, setArtistsType] = useState<ArtistCategory | "">("");
	const [hasPickedLocation, setHasPickedLocation] = useState(false);
	const [geoError, setGeoError] = useState<string | null>(null);

	const { data, isFetching, error } = useSearchArtistsQuery(
		{ lat: center.lat, lng: center.lng, radiusKm, artistsType: artistsType || null },
		{ skip: !hasPickedLocation },
	);
	const artists = data?.artists ?? [];

	function handleMapChange(lat: number, lng: number) {
		setCenter({ lat, lng });
		setHasPickedLocation(true);
	}

	function handleUseMyLocation() {
		if (!navigator.geolocation) {
			setGeoError("Your browser doesn't support geolocation - click the map instead.");
			return;
		}
		setGeoError(null);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
				setHasPickedLocation(true);
			},
			() => setGeoError("Couldn't get your location - click the map to pick a spot instead."),
		);
	}

	return (
		<main className={styles.container}>
			<header className={styles.header}>
				<div className={styles.titleGroup}>
					<h1 className={styles.title}>Find Artists</h1>
					<p className={styles.subtitle}>Click the map, drag the pin, or use your location to search nearby</p>
				</div>
				<button
					type="button"
					className={styles.useLocationButton}
					onClick={handleUseMyLocation}>
					Use my location
				</button>
			</header>

			{geoError && <p className={styles.errorMessage}>{geoError}</p>}

			<LocationPicker
				lat={center.lat}
				lng={center.lng}
				radiusKm={radiusKm}
				onChange={handleMapChange}
			/>

			<div className={styles.controls}>
				<label className={styles.controlField}>
					<span className={styles.controlLabel}>Radius: {radiusKm} km</span>
					<input
						type="range"
						min={1}
						max={200}
						value={radiusKm}
						onChange={(e) => setRadiusKm(Number(e.target.value))}
						className={styles.slider}
					/>
				</label>

				<label className={styles.controlField}>
					<span className={styles.controlLabel}>Category</span>
					<select
						value={artistsType}
						onChange={(e) => setArtistsType(e.target.value as ArtistCategory | "")}
						className={styles.select}>
						<option value="">Any</option>
						{ARTIST_CATEGORIES.map((category) => (
							<option
								key={category}
								value={category}>
								{category}
							</option>
						))}
					</select>
				</label>
			</div>

			<section className={styles.resultsSection}>
				{!hasPickedLocation && <p className={styles.emptyText}>Pick a location above to search.</p>}

				{hasPickedLocation && isFetching && <div className={styles.loading}>Searching…</div>}

				{hasPickedLocation && !isFetching && error && (
					<div className={styles.error}>Something went wrong searching. Please try again.</div>
				)}

				{hasPickedLocation && !isFetching && !error && artists.length === 0 && (
					<p className={styles.emptyText}>No artists found in that area. Try widening the radius.</p>
				)}

				{artists.length > 0 && (
					<ul className={styles.resultsList}>
						{artists.map((artist) => (
							<li
								key={artist.userId}
								className={styles.resultItem}>
								<Link
									to={ROUTES.PROFILE(artist.userName)}
									className={styles.resultLink}>
									<ProfilePicture
										avatarUrl={artist.avatarUrl}
										userName={artist.userName}
										variant="nav"
									/>
									<div className={styles.resultInfo}>
										<span className={styles.resultName}>{artist.userName}</span>
										{artist.artistsType && <span className={styles.resultType}>{artist.artistsType}</span>}
									</div>
									<span className={styles.resultDistance}>{artist.distanceKm} km</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
}

export default ArtistSearchPage;
