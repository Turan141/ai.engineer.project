import { Router } from "express"
import type { IChatMessage } from "../types/chat.types.js"
import {
	imageService,
	llmService,
	memoryService,
	promptBuilderService,
	ragService
} from "../bootstrap/dependencies.js"

export const imageRouter = Router()

imageRouter.post("/image/generate", async (req, res) => {
	const { prompt } = req.body

	if (typeof prompt !== "string" || prompt.trim() === "") {
		return res.status(400).json({ error: "Prompt is required for image generation" })
	}

	const abortController = new AbortController()
	req.on("close", () => {
		abortController.abort()
	})

	try {
		const result = await imageService.generateImage({ prompt }, abortController.signal)
		return res.json(result)
	} catch (error) {
		console.error("Error generating image:", error)
		return res.status(500).json({ error: "Failed to generate image" })
	}
})

imageRouter.get("/image/:id", async (req, res) => {
	const { id } = req.params
})

imageRouter.delete("/image/:id", async (req, res) => {
	const { id } = req.params
})

imageRouter.get("/images", async (req, res) => {
	// This could return a list of all generated images, or perhaps just the metadata (id, url) for each image
})
