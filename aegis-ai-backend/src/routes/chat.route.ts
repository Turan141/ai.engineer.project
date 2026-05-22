import { Router } from "express"
import { llmService } from "../services/llm.service.js"

export const chatRouter = Router()

chatRouter.post("/chat", async (req, res) => {
	if (!req.body) {
		return res.status(400).json({ error: "Request body is required" })
	}

	const { message } = req.body
	if (typeof message !== "string" || !message.trim()) {
		return res.status(400).json({ error: "Message is required" })
	}

	try {
		const aiResponse = await llmService.generate({ message })
		if (!aiResponse || !aiResponse.content) {
			return res.status(500).json({ error: "AI response is empty" })
		}

		return res.json({ message: aiResponse })
	} catch (error) {
		console.error("Error generating AI response:", error)
		return res.status(500).json({ error: "Failed to generate AI response" })
	}
})

chatRouter.get("/chat/stream", async (req, res) => {
	res.setHeader("Content-Type", "text/event-stream")
	res.setHeader("Cache-Control", "no-cache")
	res.setHeader("Connection", "keep-alive")
	res.flushHeaders()

	try {
		const stream = await llmService.generateStream({ message: "Hello" })

		for await (const chunk of stream) {
			res.write(`data: ${chunk.text}\n\n`)
			console.dir(chunk)
		}
	} catch (error) {
		console.error("Error generating AI response stream:", error)
		//todo handle this
		return
	}

	res.end()
})
