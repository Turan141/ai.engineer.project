import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// Proxy /api to backend server running on port 3000
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true,
				secure: false,
				// Ensure SSE responses are not buffered by the Vite proxy
				configure: (proxy) => {
					proxy.on("proxyRes", (proxyRes) => {
						// Force no buffering for event-stream responses
						if (proxyRes.headers["content-type"]?.includes("text/event-stream")) {
							proxyRes.headers["x-accel-buffering"] = "no"
							proxyRes.headers["cache-control"] = "no-cache, no-transform"
						}
					})
				}
			}
		}
	}
})
