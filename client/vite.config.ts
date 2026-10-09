import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@shared/types": fileURLToPath(new URL("../server/src/types", import.meta.url)),
			"@shared/services": fileURLToPath(new URL("../server/src/services", import.meta.url)),
			"@components": fileURLToPath(new URL("./src/components", import.meta.url)),
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
