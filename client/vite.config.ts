import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
	// Env vars live in the repo-root .env, not client/.env (merged 2026-10-11) -
	// only VITE_-prefixed vars are exposed to client code; everything else
	// (DB creds, JWT secrets, R2 secret key) stays invisible to the frontend
	// bundle regardless of envDir, per Vite's default envPrefix behavior.
	envDir: path.resolve(__dirname, ".."),
	plugins: [react()],
	resolve: {
		alias: {
			"@shared/types": path.resolve(__dirname, "../server/src/types"),
			"@shared/services": path.resolve(__dirname, "../server/src/services"),
			"@components": path.resolve(__dirname, "./src/components"),
		},
	},
	server: {
		port: 5173,
		proxy: {
			"/api": {
				target: "http://localhost:4000",
				changeOrigin: true,
			},
		},
	},
});
