import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// /api proxy is kept as a fallback but VITE_API_BASE=http://localhost:3000 in
// .env.development makes the frontend hit the backend directly, bypassing the proxy.
// Adding a proxyRes listener here switches http-proxy into "event mode" which buffers
// the full SSE response before forwarding it — that's why it was removed.
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true,
				secure: false
			}
		}
	}
})
