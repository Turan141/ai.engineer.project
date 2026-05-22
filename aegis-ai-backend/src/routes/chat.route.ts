import { Router } from "express"
import { llmService } from "../services/llm.service.js"

export const chatRouter = Router()

chatRouter.post("/chat", async (req, res) => {
	const { message } = req.body
	if (!message || !message?.trim()) {
		return res.status(400).json({ error: "Message is required" })
	}

	const aiResponse = await llmService.generate(message)
	res.json({ message: aiResponse })
})
