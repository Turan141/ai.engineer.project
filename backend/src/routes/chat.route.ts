import { Router } from "express"
import type { IChatMessage } from "../types/chat.types.js"
import type { IAgentDecision } from "../shared/interfaces/agent.interface.js"
import {
	agentService,
	llmService,
	memoryService,
	promptBuilderService,
	ragService,
	toolExecutorService
} from "../bootstrap/dependencies.js"

export const chatRouter = Router()

const SYSTEM_MESSAGE: IChatMessage = {
	role: "system",
	content: promptBuilderService.buildSystemPrompt()
}

function withSystemPrompt(messages: IChatMessage[]): IChatMessage[] {
	return [SYSTEM_MESSAGE, ...messages]
}

chatRouter.get("/chat/history/:sessionId", async (req, res) => {
	const { sessionId } = req.params
	if (typeof sessionId !== "string" || sessionId.trim() === "") {
		return res.status(400).json({ error: "Session ID is required" })
	}

	const history = await memoryService.getConversationContext(sessionId)
	return res.json({ history })
})

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

chatRouter.delete("/chat/messages/:sessionId", async (req, res) => {
	const { sessionId } = req.params
	if (typeof sessionId !== "string" || sessionId.trim() === "") {
		return res.status(400).json({ error: "Session ID is required" })
	}
	try {
		await memoryService.clearConversationContext(sessionId)
		return res.json({ success: true, message: "Conversation context cleared" })
	} catch (error) {
		console.error("Error clearing conversation context:", error)
		return res.status(500).json({ error: "Failed to clear conversation context" })
	}
})

chatRouter.get("/debug/messages/:sessionId", async (req, res) => {
	const { sessionId } = req.params
	if (typeof sessionId !== "string" || sessionId.trim() === "") {
		return res.status(400).json({ error: "Session ID is required" })
	}
	try {
		const messages = await memoryService.getConversationContext(sessionId)
		console.log(messages)
		return res.json({ messages })
	} catch (error) {
		console.error("Error fetching messages for session:", error)
		return res.status(500).json({ error: "Failed to fetch messages" })
	}
})

chatRouter.post("/chat/stream", async (req, res) => {
	const origin = req.headers.origin ?? ""
	if (
		origin === "https://ai-support-leather.vercel.app" ||
		origin.startsWith("http://localhost") ||
		origin.startsWith("http://127.0.0.1")
	) {
		res.setHeader("Access-Control-Allow-Origin", origin)
		res.setHeader("Access-Control-Allow-Private-Network", "true")
		res.setHeader("Vary", "Origin, Access-Control-Request-Private-Network")
	}

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
		const { sessionId, message, mode = "agent" } = req.body

		if (mode === "agent") {
			const resp = await agentService.handle(message)

			if (resp.type === "tool") {
				const result = await toolExecutorService.execute(resp as IAgentDecision)
				console.log("Tool execution result:", result)
				res.write(
					`data: ${JSON.stringify({
						type: "tool_result",
						result
					})}\n\n`
				)

				res.write("data: [DONE]\n\n")
				res.end()
				await memoryService.addMessage(sessionId, message, "user")
				await memoryService.addMessage(sessionId, JSON.stringify(result), "assistant")

				return
			}
		}

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
