import { Router } from "express"
import { llmService } from "../services/llm.service.js"

export const chatRouter = Router()

chatRouter.post("/chat", async (req, res) => {
	const { message } = req.body
	if (!message || !message?.trim()) {
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
