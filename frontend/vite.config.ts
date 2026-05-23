import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api to backend server running on port 3000
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
