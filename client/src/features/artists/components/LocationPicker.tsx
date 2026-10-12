import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import styles from "./LocationPicker.module.css";

// Leaflet's default marker icon references its own relative image paths,
// which don't resolve through Vite's asset pipeline unless pointed at the
// bundled URLs explicitly - this is the standard react-leaflet + Vite fix.
const pinIcon = L.icon({
	iconUrl: markerIconUrl,
	iconRetinaUrl: markerIconRetinaUrl,
	shadowUrl: markerShadowUrl,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

interface LocationPickerProps {
	lat: number;
	lng: number;
	radiusKm: number;
	onChange: (lat: number, lng: number) => void;
}

function ClickToMove({ onChange }: { onChange: (lat: number, lng: number) => void }) {
	useMapEvents({
		click(e) {
			onChange(e.latlng.lat, e.latlng.lng);
		},
	});
	return null;
}

// react-leaflet only drives the view from `center` on first mount - once
// the map exists, panning it again (e.g. after "Use my location" moves
// lat/lng from outside the map) needs an explicit setView, which this
// effect does whenever lat/lng changes from something other than a click
// or drag on the map itself.
function RecenterOnExternalChange({ lat, lng }: { lat: number; lng: number }) {
	const map = useMap();
	useEffect(() => {
		map.setView([lat, lng], map.getZoom());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lat, lng]);
	return null;
}

// A map with a draggable pin plus a translucent circle showing the search
// radius around it - click anywhere to move the pin, or drag it directly.
// Used by ArtistSearchPage.tsx to pick the center of an /api/artists/search
// call; this component itself knows nothing about artists or search, just
// "here's a point and a radius, tell me when either changes."
export function LocationPicker({ lat, lng, radiusKm, onChange }: LocationPickerProps) {
	return (
		<div className={styles.mapWrapper}>
			<MapContainer
				center={[lat, lng]}
				zoom={10}
				scrollWheelZoom
				className={styles.map}>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<Circle
					center={[lat, lng]}
					radius={radiusKm * 1000}
					pathOptions={{ color: "#272727", weight: 2, fillColor: "#f3d56b", fillOpacity: 0.15 }}
				/>
				<Marker
					position={[lat, lng]}
					icon={pinIcon}
					draggable
					eventHandlers={{
						dragend: (e) => {
							const position = (e.target as L.Marker).getLatLng();
							onChange(position.lat, position.lng);
						},
					}}
				/>
				<ClickToMove onChange={onChange} />
				<RecenterOnExternalChange
					lat={lat}
					lng={lng}
				/>
			</MapContainer>
		</div>
	);
}
