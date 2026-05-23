import { Router } from "express"
import { llmService } from "../services/llm.service.js"

export const chatRouter = Router()

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
		const aiResponse = await llmService.generate(req.body, abortController.signal)
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
	res.setHeader("Cache-Control", "no-cache")
	res.setHeader("Connection", "keep-alive")
	res.flushHeaders()

	const abortController = new AbortController()

	req.on("close", () => {
		abortController.abort()
	})

	try {
		const stream = await llmService.generateStream(req.body, abortController.signal)

		for await (const chunk of stream) {
			if (abortController.signal.aborted) {
				console.log("Request aborted by the client")
				break
			}
			res.write(`data: ${JSON.stringify(chunk)}\n\n`)
			console.dir(chunk)
		}
	} catch (error) {
		console.error("Error generating AI response stream:", error)
		//todo handle this
		return
	}

	res.end()
})
