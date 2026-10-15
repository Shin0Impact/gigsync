import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfilePicture from "../../../components/user/ProfilePicture";
import { ROUTES } from "../../../routes/routePaths";
import type { ArtistCategory, ArtistSearchResult } from "@shared/types/index";
import { Button } from "@components";
import styles from "./ArtistSearch.module.css";
import { Chip, FilterField, SearchToolbar } from "./SearchToolbar";
import { LocationPicker, useSearchArtistsQuery } from "../../artists";

const ARTIST_CATEGORIES: ArtistCategory[] = ["painter", "photographer", "designer", "musician"];

type SortOption = "distance" | "followers" | "availability";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "distance", label: "Distance" },
	{ value: "followers", label: "Follower count" },
	{ value: "availability", label: "Availability" },
];

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

function sort_artists(artists: ArtistSearchResult[], sortBy: SortOption): ArtistSearchResult[] {
	const sorted = [...artists];
	if (sortBy === "followers") {
		sorted.sort((a, b) => b.followersNumber - a.followersNumber);
	} else if (sortBy === "availability") {
		sorted.sort((a, b) => {
			if (a.isEmergencyAvailable === b.isEmergencyAvailable) return a.distanceKm - b.distanceKm;
			return a.isEmergencyAvailable ? -1 : 1;
		});
	} else {
		sorted.sort((a, b) => a.distanceKm - b.distanceKm);
	}
	return sorted;
}

export function ArtistSearch() {
	const [center, setCenter] = useState(DEFAULT_CENTER);
	const [radiusKm, setRadiusKm] = useState(25);
	const [artistsType, setArtistsType] = useState<ArtistCategory | "">("");
	const [sortBy, setSortBy] = useState<SortOption>("distance");
	const [hasPickedLocation, setHasPickedLocation] = useState(false);
	const [geoError, setGeoError] = useState<string | null>(null);
	const [placeQuery, setPlaceQuery] = useState("");
	const [isGeocoding, setIsGeocoding] = useState(false);
	const [placeError, setPlaceError] = useState<string | null>(null);
	const [isMapOpen, setIsMapOpen] = useState(false);
	const [nearestPlaceName, setNearestPlaceName] = useState<string | null>(null);

	const { data } = useSearchArtistsQuery(
		{ lat: center.lat, lng: center.lng, radiusKm, artistsType: artistsType || null },
		{ skip: !hasPickedLocation },
	);
	const artists = sort_artists(data?.artists ?? [], sortBy);

	function handleMapChange(lat: number, lng: number) {
		setCenter({ lat, lng });
		setHasPickedLocation(true);
	}

	function handleUseMyLocation(options?: { silent?: boolean }) {
		if (!navigator.geolocation) {
			if (!options?.silent) {
				setGeoError("Your browser doesn't support geolocation - try the map or search a place instead.");
			}
			return;
		}
		if (!options?.silent) setGeoError(null);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
				setHasPickedLocation(true);
			},
			() => {
				if (!options?.silent) {
					setGeoError("Couldn't get your location - try the map or search a place instead.");
				}
			},
		);
	}

	function handleClearLocation() {
		setHasPickedLocation(false);
		setPlaceQuery("");
		setNearestPlaceName(null);
		setPlaceError(null);
		setGeoError(null);
	}

	function handleQueryChange(val: string) {
		setPlaceQuery(val);
		if (!val.trim()) {
			handleClearLocation();
		}
	}

	useEffect(() => {
		if (!isMapOpen) return;
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") setIsMapOpen(false);
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isMapOpen]);

	useEffect(() => {
		if (!hasPickedLocation) return;
		let cancelled = false;

		const timeoutId = setTimeout(async () => {
			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=10&addressdetails=1`,
				);
				if (!response.ok) throw new Error("reverse geocoding failed");
				const result: { address?: Record<string, string>; display_name?: string } = await response.json();
				if (cancelled) return;

				const address = result.address ?? {};
				const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county ?? null;
				const region = address.state ?? address.country ?? null;
				if (city) {
					setNearestPlaceName(region && region !== city ? `${city}, ${region}` : city);
				} else {
					setNearestPlaceName(result.display_name ?? null);
				}
			} catch {
				if (!cancelled) setNearestPlaceName(null);
			}
		}, 600);

		return () => {
			cancelled = true;
			clearTimeout(timeoutId);
		};
	}, [center.lat, center.lng, hasPickedLocation]);

	async function handlePlaceSearch(e: React.FormEvent) {
		e.preventDefault();
		const query = placeQuery.trim();
		if (!query) return;

		setIsGeocoding(true);
		setPlaceError(null);
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
			);
			if (!response.ok) throw new Error("geocoding request failed");
			const results: { lat: string; lon: string }[] = await response.json();
			if (results.length === 0) {
				setPlaceError("Couldn't find that place - try a different search.");
				return;
			}
			setCenter({ lat: Number(results[0].lat), lng: Number(results[0].lon) });
			setHasPickedLocation(true);
		} catch {
			setPlaceError("Couldn't search for that place - try again.");
		} finally {
			setIsGeocoding(false);
		}
	}

	return (
		<div className={styles.container}>
			<SearchToolbar
				value={placeQuery}
				onChange={handleQueryChange}
				placeholder="Search a city, address, or place…"
				ariaLabel="Search near a place"
				onSubmit={() => handlePlaceSearch({ preventDefault() {} } as React.FormEvent)}
				submitLabel={isGeocoding ? "Searching…" : "Search"}
				submitDisabled={isGeocoding || !placeQuery.trim()}
				activeFilterCount={(artistsType ? 1 : 0) + (sortBy !== "distance" ? 1 : 0)}
				message={geoError ?? placeError}
				chips={
					<Chip
						isActive={hasPickedLocation}
						onClear={hasPickedLocation ? handleClearLocation : undefined}>
						{hasPickedLocation
							? `Within ${radiusKm} km of ${nearestPlaceName ?? `${center.lat.toFixed(3)},${center.lng.toFixed(3)}`}`
							: "No location picked yet"}
					</Chip>
				}
				filters={
					<>
						<FilterField label="Category">
							<select
								value={artistsType}
								onChange={(e) => setArtistsType(e.target.value as ArtistCategory | "")}>
								<option value="">Any</option>
								{ARTIST_CATEGORIES.map((category) => (
									<option
										key={category}
										value={category}>
										{category}
									</option>
								))}
							</select>
						</FilterField>
						<FilterField label="Sort by">
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value as SortOption)}>
								{SORT_OPTIONS.map((option) => (
									<option
										key={option.value}
										value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</FilterField>
						<Button
							type="button"
							variant="solid"
							className={styles.filterButton}
							onClick={() => setIsMapOpen(true)}>
							{hasPickedLocation ? "Change on map" : "Pick on map"}
						</Button>
						<Button
							type="button"
							variant="solid"
							className={styles.filterButton}
							onClick={() => handleUseMyLocation()}>
							Use my location
						</Button>
					</>
				}
			/>

			{isMapOpen && (
				<div
					className={styles.mapModalBackdrop}
					onClick={() => setIsMapOpen(false)}>
					<div
						className={styles.mapModal}
						role="dialog"
						aria-modal="true"
						aria-label="Pick a location on the map"
						onClick={(e) => e.stopPropagation()}>
						<div className={styles.mapModalHeader}>
							<h2 className={styles.mapModalTitle}>Pick a location</h2>
							<Button
								type="button"
								variant="ghost"
								className={styles.mapModalClose}
								onClick={() => setIsMapOpen(false)}
								aria-label="Close">
								×
							</Button>
						</div>

						<LocationPicker
							lat={center.lat}
							lng={center.lng}
							radiusKm={radiusKm}
							onChange={handleMapChange}
						/>

						<label className={styles.mapModalRadius}>
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

						<Button
							type="button"
							variant="solid"
							className={styles.mapModalDone}
							onClick={() => setIsMapOpen(false)}>
							Done
						</Button>
					</div>
				</div>
			)}

			{hasPickedLocation && artists.length > 0 && (
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
									<div className={styles.resultMeta}>
										{artist.artistsType && <span className={styles.resultType}>{artist.artistsType}</span>}
										<span className={styles.resultType}>· {artist.followersNumber} followers</span>
										{artist.isEmergencyAvailable && (
											<span className={styles.resultBadge}>Available now</span>
										)}
									</div>
								</div>
								<span className={styles.resultDistance}>{artist.distanceKm} km</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export default ArtistSearch;
