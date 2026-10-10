const BASE = (import.meta.env.VITE_R2_PUBLIC_URL ?? "").replace(/\/+$/, "");

if (import.meta.env.DEV && !BASE) {
	console.warn("VITE_R2_PUBLIC_URL is not set - media URLs will resolve against the Vite dev server.");
}

export function getMediaUrl(r2Key: string): string {
	const encoded = r2Key.split("/").map(encodeURIComponent).join("/");
	return `${BASE}/${encoded}`;
}
