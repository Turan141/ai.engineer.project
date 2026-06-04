import { Router } from "express"
import type { Response } from "express"
import { chatService } from "../bootstrap/dependencies.js"

export const chatRouter = Router()

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim() !== ""
}

function configureStreamHeaders(origin: string | undefined, res: Response): void {
	if (
		origin === "https://ai-support-leather.vercel.app" ||
		origin?.startsWith("http://localhost") ||
		origin?.startsWith("http://127.0.0.1")
	) {
		res.setHeader("Access-Control-Allow-Origin", origin)
		res.setHeader("Access-Control-Allow-Private-Network", "true")
		res.setHeader("Vary", "Origin, Access-Control-Request-Private-Network")
	}

	res.setHeader("Content-Type", "text/event-stream")
	res.setHeader("Cache-Control", "no-cache, no-transform")
	res.setHeader("Connection", "keep-alive")
	res.setHeader("X-Accel-Buffering", "no")
}

chatRouter.get("/chat/history/:sessionId", async (req, res) => {
	const { sessionId } = req.params
	if (!isNonEmptyString(sessionId)) {
		return res.status(400).json({ error: "Session ID is required" })
	}

	const history = await chatService.getHistory(sessionId)
	return res.json({ history })
})

chatRouter.post("/embeddings", async (req, res) => {
	const abortController = new AbortController()
	req.on("close", () => {
		abortController.abort()
	})

	const { text } = req.body
	if (!isNonEmptyString(text)) {
		return res.status(400).json({ error: "Text is required for embedding generation" })
	}

	try {
		const embedding = await chatService.generateEmbedding(
			text,
			abortController.signal
		)
		return res.json({ embedding })
	} catch (error) {
		if ((error as any)?.name === "AbortError") {
			return
		}
		console.error("Error generating embedding:", error)
		return res.status(500).json({ error: "Failed to generate embedding" })
	}
})

chatRouter.delete("/chat/messages/:sessionId", async (req, res) => {
	const { sessionId } = req.params
	if (!isNonEmptyString(sessionId)) {
		return res.status(400).json({ error: "Session ID is required" })
	}

	try {
		await chatService.clearHistory(sessionId)
		return res.json({ success: true, message: "Conversation context cleared" })
	} catch (error) {
		console.error("Error clearing conversation context:", error)
		return res.status(500).json({ error: "Failed to clear conversation context" })
	}
})

chatRouter.get("/debug/messages/:sessionId", async (req, res) => {
	const { sessionId } = req.params
	if (!isNonEmptyString(sessionId)) {
		return res.status(400).json({ error: "Session ID is required" })
	}

	try {
		const messages = await chatService.getDebugMessages(sessionId)
		console.log(messages)
		return res.json({ messages })
	} catch (error) {
		console.error("Error fetching messages for session:", error)
		return res.status(500).json({ error: "Failed to fetch messages" })
	}
})

chatRouter.post("/chat/stream", async (req, res) => {
	configureStreamHeaders(req.headers.origin, res)
	req.socket?.setNoDelay(true)
	res.flushHeaders()

	const abortController = new AbortController()
	res.on("close", () => {
		abortController.abort()
	})

	try {
		await chatService.handleStream(
			req.body,
			{
				write: (data) => res.write(data),
				end: () => res.end()
			},
			abortController.signal
		)
	} catch (error) {
		if ((error as any)?.name === "AbortError") {
			res.end()
			return
		}
		console.error("Error generating AI response stream:", error)
		try {
			res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`)
		} catch (_writeError) {
			// Ignore write errors after the client disconnects.
		}
		res.end()
	}
})
