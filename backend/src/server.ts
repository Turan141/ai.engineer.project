import "dotenv/config"
import express from "express"
import { chatRouter } from "./routes/chat.route.js"
import { InMemoryVectorStore } from "./services/vector.store.service.js"

const app = express()

// Allow the Vite dev server (and any localhost port) to call the backend directly.
// This bypasses Vite's HTTP proxy which buffers SSE responses.
app.use((req, res, next) => {
	const origin = req.headers.origin ?? ""
	if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
		res.setHeader("Access-Control-Allow-Origin", origin)
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		res.setHeader("Access-Control-Allow-Headers", "Content-Type")
	}
	if (req.method === "OPTIONS") {
		res.sendStatus(204)
		return
	}
	next()
})

app.use(express.json())
app.use("/api", chatRouter)

// Health check endpoint
app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" })
})

app.listen(3000, () => {
	console.log("Server is running on port 3000")
})
