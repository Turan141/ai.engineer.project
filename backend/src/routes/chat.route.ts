import { Router } from "express"
import { buildSystemPrompt } from "../utils/prompt_builder.js"
import type { IChatMessage } from "../types/chat.types.js"
import { llmService, memoryService, ragService } from "../bootstrap/dependencies.js"

export const chatRouter = Router()

const SYSTEM_MESSAGE: IChatMessage = { role: "system", content: buildSystemPrompt() }

function withSystemPrompt(messages: IChatMessage[]): IChatMessage[] {
	return [SYSTEM_MESSAGE, ...messages]
}

chatRouter.post("/embeddings", async (req, res) => {
	const { text } = req.body

	const abortController = new AbortController()
	req.on("close", () => {
		abortController.abort()
	})

	if (typeof text !== "string" || text.trim() === "") {
		return res.status(400).json({ error: "Text is required for embedding generation" })
	}

	try {
		const embedding = await llmService.generateEmbedding(text, abortController.signal)
		return res.json({ embedding })
	} catch (error) {
		if ((error as any)?.name === "AbortError") {
			// Client disconnected — no need to write anything
			return
		}
		console.error("Error generating embedding:", error)
		return res.status(500).json({ error: "Failed to generate embedding" })
	}
})

chatRouter.post("/chat", async (req, res) => {
	if (!req.body) {
		return res.status(400).json({ error: "Request body is required" })
	}

	const abortController = new AbortController()

	req.on("close", () => {
		abortController.abort()
	})

	const { messages } = req.body
	if (!Array.isArray(messages) || messages.length === 0) {
		return res.status(400).json({ error: "Messages are required" })
	}

	try {
		const aiResponse = await llmService.generate(
			{ messages: withSystemPrompt(messages) },
			abortController.signal
		)
		if (!aiResponse || !aiResponse.content) {
			return res.status(500).json({ error: "AI response is empty" })
		}

		return res.json({ message: aiResponse })
	} catch (error) {
		console.error("Error generating AI response:", error)
		return res.status(500).json({ error: "Failed to generate AI response" })
	}
})

chatRouter.post("/chat/stream", async (req, res) => {
	res.setHeader("Content-Type", "text/event-stream")
	res.setHeader("Cache-Control", "no-cache, no-transform")
	res.setHeader("Connection", "keep-alive")
	res.setHeader("X-Accel-Buffering", "no")
	req.socket?.setNoDelay(true)
	res.flushHeaders()

	const abortController = new AbortController()

	res.on("close", () => {
		abortController.abort()
	})

	try {
		const { sessionId, message } = req.body

		await memoryService.addMessage(sessionId, message, "user")
		const messages = await memoryService.getConversationContext(sessionId)

		const stream = ragService.askStream(
			withSystemPrompt(messages),
			abortController.signal
		)

		let assistantResponse = ""

		for await (const chunk of stream) {
			if (abortController.signal.aborted) {
				console.log("Request aborted by the client")
				break
			}
			assistantResponse += chunk.text
			res.write(`data: ${JSON.stringify(chunk)}\n\n`)
		}
		await memoryService.addMessage(sessionId, assistantResponse, "assistant")
		res.write("data: [DONE]\n\n")
		res.end()
	} catch (error) {
		if ((error as any)?.name === "AbortError") {
			// Client disconnected — no need to write anything
			res.end()
			return
		}
		console.error("Error generating AI response stream:", error)
		try {
			res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`)
		} catch (e) {
			// ignore write errors
		}
		res.end()
		return
	}
})
