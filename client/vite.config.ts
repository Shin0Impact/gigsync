import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
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
