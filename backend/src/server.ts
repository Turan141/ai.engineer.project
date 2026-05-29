import "dotenv/config"
import cors from "cors"
import express from "express"
import { randomUUID } from "node:crypto"
import { chatRouter } from "./routes/chat.route.js"
import { initializeApplication } from "./bootstrap/ApplicationManager.js"
import { imageRouter } from "./routes/image.routes.js"
import { documentRouter } from "./routes/document.route.js"
import { logger } from "./shared/logger.js"

const app = express()

app.use(
	cors({
		origin: ["https://ai-support-leather.vercel.app", "http://localhost:5173"]
	})
)

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

// Request logging: requestId, method, url, status, durationMs
app.use((req, res, next) => {
	const requestId = randomUUID()
	const start = Date.now()
	;(req as any).requestId = requestId

	res.on("finish", () => {
		logger.info(
			{
				requestId,
				method: req.method,
				url: req.url,
				status: res.statusCode,
				durationMs: Date.now() - start
			},
			"http"
		)
	})

	next()
})

app.use("/api", chatRouter)
app.use("/api", imageRouter)
app.use("/api", documentRouter)

// Health check endpoint
app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" })
})

async function bootstrap(): Promise<void> {
	await initializeApplication()

	app.listen(process.env.PORT, () => {
		logger.info({ port: process.env.PORT ?? 3000 }, "server started")
	})
}

void bootstrap()
