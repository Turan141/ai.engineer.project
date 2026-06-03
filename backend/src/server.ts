import "dotenv/config"
import cors from "cors"
import express from "express"
import { randomUUID } from "node:crypto"
import { chatRouter } from "./routes/chat.route.js"
import { initializeApplication } from "./bootstrap/ApplicationManager.js"
import { imageRouter } from "./routes/image.routes.js"
import { documentRouter } from "./routes/document.route.js"
import { debugRouter } from "./routes/debug.route.js"
import { logger } from "./shared/logger.js"

const app = express()

const allowedOrigins = new Set(["https://ai-support-leather.vercel.app"])

function isAllowedOrigin(origin: string): boolean {
	return (
		allowedOrigins.has(origin) ||
		origin.startsWith("http://localhost") ||
		origin.startsWith("http://127.0.0.1")
	)
}

// Private Network Access preflights are answered before cors() can finish OPTIONS.
app.use((req, res, next) => {
	const origin = req.headers.origin ?? ""

	if (isAllowedOrigin(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin)
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")
		res.setHeader("Access-Control-Allow-Private-Network", "true")
		res.setHeader("Vary", "Origin, Access-Control-Request-Private-Network")
	}

	if (req.method === "OPTIONS") {
		res.sendStatus(204)
		return
	}

	next()
})

app.use(
	cors({
		origin(origin, callback) {
			if (!origin || isAllowedOrigin(origin)) {
				callback(null, true)
				return
			}

			callback(new Error(`Origin ${origin} is not allowed by CORS`))
		},
		allowedHeaders: ["Content-Type", "Authorization", "Accept"],
		methods: ["GET", "POST", "OPTIONS", "DELETE"]
	})
)

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
app.use("/api", debugRouter)

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
