import { useEffect, useState } from "react";
import { Button } from "@components";
import { useMeQuery } from "../../auth";
import { useListEventsQuery } from "../../events/eventsApi";
import { EventCard } from "../../events/components/EventCard";
import styles from "./ArtistSearch.module.css";
import { Chip, FilterField, SearchToolbar } from "./SearchToolbar";
import eventStyles from "./EventSearch.module.css";

type EventSortOption = "date" | "newest" | "title" | "distance";

const SORT_OPTIONS: { value: EventSortOption; label: string }[] = [
	{ value: "date", label: "Soonest first" },
	{ value: "newest", label: "Recently posted" },
	{ value: "title", label: "Name (A–Z)" },
	{ value: "distance", label: "Nearest" },
];

const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 200];

export function EventSearch() {
	const { data: meData } = useMeQuery();
	const userRole = meData?.user?.role ?? "guest";

	const [text, setText] = useState("");
	const [debouncedText, setDebouncedText] = useState("");
	const [sortBy, setSortBy] = useState<EventSortOption>("date");
	const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
	const [centerLabel, setCenterLabel] = useState<string | null>(null);
	const [radiusKm, setRadiusKm] = useState(25);
	const [placeQuery, setPlaceQuery] = useState("");
	const [isGeocoding, setIsGeocoding] = useState(false);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [urgentOnly, setUrgentOnly] = useState(false);

	useEffect(() => {
		const id = setTimeout(() => setDebouncedText(text.trim()), 300);
		return () => clearTimeout(id);
	}, [text]);

	// "Nearest" needs a centre; fall back to soonest if it gets cleared.
	const effectiveSort = sortBy === "distance" && !center ? "date" : sortBy;

	const { data, isFetching, error } = useListEventsQuery({
		q: debouncedText || undefined,
		sort: effectiveSort,
		urgent: urgentOnly,
		...(center ? { lat: center.lat, lng: center.lng, radiusKm } : {}),
	});
	const events = data?.events ?? [];

	function handleUseMyLocation() {
		if (!navigator.geolocation) {
			setLocationError("Your browser doesn't support geolocation - try searching a place instead.");
			return;
		}
		setLocationError(null);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
				setCenterLabel("your location");
				setSortBy("distance");
			},
			() => setLocationError("Couldn't get your location - try searching a place instead."),
		);
	}

	async function handlePlaceSearch(e: React.SyntheticEvent) {
		e.preventDefault();
		const query = placeQuery.trim();
		if (!query) return;

		setIsGeocoding(true);
		setLocationError(null);
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
			);
			if (!response.ok) throw new Error("geocoding request failed");
			const results: { lat: string; lon: string }[] = await response.json();
			if (results.length === 0) {
				setLocationError("Couldn't find that place - try a different search.");
				return;
			}
			setCenter({ lat: Number(results[0].lat), lng: Number(results[0].lon) });
			setCenterLabel(query);
			setSortBy("distance");
		} catch {
			setLocationError("Couldn't search for that place - try again.");
		} finally {
			setIsGeocoding(false);
		}
	}

	function clearLocation() {
		setCenter(null);
		setCenterLabel(null);
		setPlaceQuery("");
		setLocationError(null);
	}

	const activeFilterCount = (center ? 1 : 0) + (urgentOnly ? 1 : 0) + (sortBy !== "date" ? 1 : 0);

	return (
		<div className={styles.container}>
			<SearchToolbar
				value={text}
				onChange={setText}
				placeholder="Search events by name, venue or description…"
				ariaLabel="Search events"
				activeFilterCount={activeFilterCount}
				message={locationError}
				chips={
					(center || urgentOnly) && (
						<>
							{center && (
								<Chip onClear={clearLocation}>
									Within {radiusKm} km of {centerLabel}
								</Chip>
							)}
							{urgentOnly && <Chip onClear={() => setUrgentOnly(false)}>Urgent only</Chip>}
						</>
					)
				}
				filters={
					<>
						<FilterField label="Sort by">
							<select
								value={effectiveSort}
								onChange={(e) => setSortBy(e.target.value as EventSortOption)}>
								{SORT_OPTIONS.map((option) => (
									<option
										key={option.value}
										value={option.value}
										disabled={option.value === "distance" && !center}>
										{option.label}
									</option>
								))}
							</select>
						</FilterField>

						<FilterField label="Near a place">
							<input
								type="text"
								value={placeQuery}
								onChange={(e) => setPlaceQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handlePlaceSearch(e);
									}
								}}
								placeholder="City or address, then Enter"
							/>
						</FilterField>

						{center && (
							<FilterField label="Radius">
								<select
									value={radiusKm}
									onChange={(e) => setRadiusKm(Number(e.target.value))}>
									{RADIUS_OPTIONS.map((km) => (
										<option
											key={km}
											value={km}>
											{km} km
										</option>
									))}
								</select>
							</FilterField>
						)}

						<div className={eventStyles.options}>
							<label className={eventStyles.checkLabel}>
								<input
									type="checkbox"
									checked={urgentOnly}
									onChange={(e) => setUrgentOnly(e.target.checked)}
								/>{" "}
								Urgent only
							</label>
							<Button
								type="button"
								variant="ghost"
								onClick={handleUseMyLocation}
								disabled={isGeocoding}>
								Use my location
							</Button>
						</div>
					</>
				}
			/>

			<section className={styles.resultsSection}>
				{isFetching && <div className={styles.loading}>Searching…</div>}

				{!isFetching && error && (
					<div className={styles.error}>Something went wrong searching. Please try again.</div>
				)}

				{!isFetching && !error && events.length === 0 && (
					<p className={styles.emptyText}>
						No events found{debouncedText ? ` for “${debouncedText}”` : ""}
						{center ? ". Try widening the radius." : "."}
					</p>
				)}

				{!isFetching && events.length > 0 && (
					<div className={eventStyles.results}>
						{events.map((event) => (
							<div
								key={event.id}
								className={eventStyles.result}>
								{event.distance_km != null && (
									<span className={eventStyles.distance}>{Math.round(event.distance_km * 10) / 10} km away</span>
								)}
								<EventCard
									event={event}
									userRole={userRole}
								/>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
