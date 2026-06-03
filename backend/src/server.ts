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

const allowedOrigins = new Set([
	"https://ai-support-leather.vercel.app",
	...(process.env.CORS_ALLOWED_ORIGINS ?? "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean)
])
const allowedMethods = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
const defaultAllowedHeaders = "Content-Type, Authorization, Accept"

function isAllowedOrigin(origin: string): boolean {
	if (allowedOrigins.has(origin)) return true
	if (origin.startsWith("http://localhost")) return true
	if (origin.startsWith("http://127.0.0.1")) return true

	try {
		const { hostname } = new URL(origin)
		return hostname.endsWith(".vercel.app") || hostname.endsWith(".tail0c91e0.ts.net")
	} catch (_error) {
		return false
	}
}

// Private Network Access preflights are answered before cors() can finish OPTIONS.
app.use((req, res, next) => {
	const origin = req.headers.origin ?? ""

	if (isAllowedOrigin(origin)) {
		const requestedHeaders = req.headers["access-control-request-headers"]

		res.setHeader("Access-Control-Allow-Origin", origin)
		res.setHeader("Access-Control-Allow-Methods", allowedMethods)
		res.setHeader(
			"Access-Control-Allow-Headers",
			typeof requestedHeaders === "string" ? requestedHeaders : defaultAllowedHeaders
		)
		res.setHeader("Access-Control-Allow-Private-Network", "true")
		res.setHeader("Access-Control-Max-Age", "86400")
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
		methods: allowedMethods.split(", ")
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
