import {
	useEffect,
	useState,
	type FormHTMLAttributes,
	type InputHTMLAttributes,
	type ReactNode,
	type SelectHTMLAttributes,
	type TextareaHTMLAttributes,
} from "react";
import styles from "./Form.module.css";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { LocationPicker } from "../../features/artists";

interface FormRootProps extends FormHTMLAttributes<HTMLFormElement> {
	title?: string;
	header?: ReactNode;
	isDrawer?: boolean;
	children: ReactNode;
}

function FormRoot({ title, header, isDrawer = false, children, className = "", ...props }: FormRootProps) {
	return (
		<div
			className={styles.formWrapper}
			data-drawer={isDrawer}>
			{header}
			<div className={styles.formBody}>
				{title && <h1 className={styles.title}>{title}</h1>}
				<form
					className={`${styles.form} ${className}`.trim()}
					action=""
					method="post"
					{...props}>
					{children}
				</form>
			</div>
		</div>
	);
}

interface HeaderProps {
	left?: ReactNode;
	center?: ReactNode;
	right?: ReactNode;
}

function Header({ left, center, right }: HeaderProps) {
	return (
		<header className={styles.formHeader}>
			<div className={styles.left}>{left}</div>
			<div className={styles.center}>{center}</div>
			<div className={styles.right}>{right}</div>
		</header>
	);
}

function Field({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <div className={`${styles.field} ${className}`.trim()}>{children}</div>;
}

function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
	return (
		<label
			htmlFor={htmlFor}
			className={styles.label}>
			{children}
		</label>
	);
}

function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			className={`${styles.input} ${className}`.trim()}
			{...props}
		/>
	);
}

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	file: File | null;
	buttonText?: string;
}

function FileInput({ id, file, buttonText = "Choose File", onChange, disabled, className = "", ...props }: FileInputProps) {
	return (
		<div>
			<input
				id={id}
				type="file"
				className={styles.fileInputHidden}
				onChange={onChange}
				disabled={disabled}
				{...props}
			/>
			<label
				htmlFor={id}
				className={`${styles.fileInputLabel} ${file ? styles.fileInputHasFile : ""} ${className}`.trim()}>
				{file ? `✓ ${file.name}` : buttonText}
			</label>
		</div>
	);
}

function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return (
		<textarea
			className={`${styles.textarea || styles.input} ${className}`.trim()}
			{...props}
		/>
	);
}

function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
	return (
		<select
			className={`${styles.select || styles.input} ${className}`.trim()}
			{...props}>
			{children}
		</select>
	);
}

function ButtonRow({ children }: { children: ReactNode }) {
	return <div className={styles.buttonRow}>{children}</div>;
}

interface OptionGroupProps<T extends string> {
	options: readonly { label: string; value: T }[];
	value: T | "";
	onChange: (value: T) => void;
}

function OptionGroup<T extends string>({ options, value, onChange }: OptionGroupProps<T>) {
	return (
		<div className={styles.buttonRow}>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					className={`${styles.optionButton} ${value === option.value ? styles.activeOption : ""}`.trim()}
					onClick={() => onChange(option.value)}>
					{option.label}
				</button>
			))}
		</div>
	);
}

interface CheckboxProps {
	id: string;
	label: ReactNode;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
}

// Deliberately its own component rather than reusing Input - the .field
// input/textarea/select cascade in Form.module.css makes every plain
// <input> a full-width bordered box, which is right for text fields and
// wrong for a checkbox. This renders outside that scope with its own
// (small, inline) styling instead.
function Checkbox({ id, label, checked, onChange, disabled }: CheckboxProps) {
	return (
		<label
			htmlFor={id}
			className={styles.checkboxField}
			data-disabled={disabled}>
			<input
				id={id}
				type="checkbox"
				className={styles.checkboxInput}
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				disabled={disabled}
			/>
			<span>{label}</span>
		</label>
	);
}

function ErrorMessage({ children }: { children: ReactNode }) {
	return (
		<p
			className={styles.fieldError}
			role="alert">
			{children}
		</p>
	);
}

function Submit({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="submit"
			className={`${styles.submitButton} ${className}`.trim()}
			{...props}>
			{children}
		</button>
	);
}

function ToggleButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			className={`${styles.toggleButton} ${className}`.trim()}
			{...props}>
			{children}
		</button>
	);
}

interface DatePickerProps {
	selected?: Date;
	onSelect?: (date: Date | undefined) => void;
	className?: string;
	[key: string]: any; // fallback for any other calendar props
}

function DatePicker({ selected, onSelect, className = "", ...props }: DatePickerProps) {
	return (
		<DayPicker
			animate
			mode="single"
			selected={selected}
			onSelect={onSelect}
			className={`${styles.rdp} ${className}`.trim()}
			{...props}
		/>
	);
}

interface LocationValue {
	lat: number;
	lng: number;
}

interface FormLocationPickerProps {
	value: LocationValue;
	onChange: (location: LocationValue, placeName?: string) => void;
	defaultPlaceName?: string;
}

function FormLocationPicker({ value, onChange, defaultPlaceName }: FormLocationPickerProps) {
	const [hasPickedLocation, setHasPickedLocation] = useState(Boolean(value.lat || value.lng));
	const [geoError, setGeoError] = useState<string | null>(null);
	const [placeQuery, setPlaceQuery] = useState("");
	const [isGeocoding, setIsGeocoding] = useState(false);
	const [placeError, setPlaceError] = useState<string | null>(null);
	const [isMapOpen, setIsMapOpen] = useState(false);
	const [nearestPlaceName, setNearestPlaceName] = useState<string | null>(defaultPlaceName ?? null);

	function handleMapChange(lat: number, lng: number) {
		setHasPickedLocation(true);
		onChange({ lat, lng }, nearestPlaceName ?? undefined);
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
				const lat = position.coords.latitude;
				const lng = position.coords.longitude;
				setHasPickedLocation(true);
				onChange({ lat, lng });
			},
			() => {
				if (!options?.silent) {
					setGeoError("Couldn't get your location - try the map or search a place instead.");
				}
			},
		);
	}

	useEffect(() => {
		if (!hasPickedLocation) return;
		let cancelled = false;

		const timeoutId = setTimeout(async () => {
			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/reverse?format=json&lat=${value.lat}&lon=${value.lng}&zoom=10&addressdetails=1`,
				);
				if (!response.ok) throw new Error("reverse geocoding failed");
				const result: { address?: Record<string, string>; display_name?: string } = await response.json();
				if (cancelled) return;

				const address = result.address ?? {};
				const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county ?? null;
				const region = address.state ?? address.country ?? null;
				const name = city ? (region && region !== city ? `${city}, ${region}` : city) : (result.display_name ?? null);

				setNearestPlaceName(name);
				if (name) onChange(value, name);
			} catch {
				if (!cancelled) setNearestPlaceName(null);
			}
		}, 600);

		return () => {
			cancelled = true;
			clearTimeout(timeoutId);
		};
	}, [value.lat, value.lng, hasPickedLocation]);

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
			const lat = Number(results[0].lat);
			const lng = Number(results[0].lon);
			setHasPickedLocation(true);
			onChange({ lat, lng });
		} catch {
			setPlaceError("Couldn't search for that place - try again.");
		} finally {
			setIsGeocoding(false);
		}
	}

	return (
		<div className={styles.locationPickerWrapper}>
			{geoError && <p className={styles.fieldError}>{geoError}</p>}

			<div className={styles.locationSearchRow}>
				<Input
					type="text"
					value={placeQuery}
					onChange={(e) => setPlaceQuery(e.target.value)}
					placeholder="Search a city, address, or place…"
				/>
				<button
					type="button"
					className={styles.searchButton}
					onClick={handlePlaceSearch}
					disabled={isGeocoding || !placeQuery.trim()}>
					{isGeocoding ? "Searching…" : "Search"}
				</button>
			</div>

			{placeError && <p className={styles.fieldError}>{placeError}</p>}

			<div className={styles.locationSummaryCard}>
				<span className={styles.locationSummaryText}>
					{hasPickedLocation
						? `Selected: ${nearestPlaceName ?? `${value.lat.toFixed(3)},${value.lng.toFixed(3)}`}`
						: "No location picked yet"}
				</span>

				<div className={styles.locationActionRow}>
					<button
						type="button"
						className={styles.mapButton}
						onClick={() => setIsMapOpen(true)}>
						{hasPickedLocation ? "Change on map" : "Pick on map"}
					</button>
					<button
						type="button"
						className={styles.gpsButton}
						onClick={() => handleUseMyLocation()}>
						Use my location
					</button>
				</div>
			</div>

			{isMapOpen && (
				<div
					className={styles.mapModalBackdrop}
					onClick={() => setIsMapOpen(false)}>
					<div
						className={styles.mapModalContent}
						role="dialog"
						aria-modal="true"
						aria-label="Pick a location on the map"
						onClick={(e) => e.stopPropagation()}>
						<div className={styles.mapModalHeader}>
							<h2>Pick a location</h2>
							<button
								type="button"
								className={styles.closeButton}
								onClick={() => setIsMapOpen(false)}
								aria-label="Close">
								×
							</button>
						</div>

						<div className={styles.mapContainer}>
							<LocationPicker
								lat={value.lat || 40.7128}
								lng={value.lng || -74.006}
								radiusKm={1}
								onChange={handleMapChange}
							/>
						</div>

						<button
							type="button"
							className={styles.doneButton}
							onClick={() => setIsMapOpen(false)}>
							Done
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export const Form = Object.assign(FormRoot, {
	Header,
	Field,
	Label,
	Input,
	FileInput,
	TextArea,
	Select,
	ButtonRow,
	OptionGroup,
	Checkbox,
	ErrorMessage,
	Submit,
	ToggleButton,
	DatePicker,
	LocationPicker: FormLocationPicker,
});
