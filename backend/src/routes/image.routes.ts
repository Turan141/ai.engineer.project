import { Router } from "express"
import {
	imageService,
	llmService,
	memoryService,
	promptBuilderService,
	ragService
} from "../bootstrap/dependencies.js"
import { config } from "../config/config.js"
import path from "path"

export const imageRouter = Router()

imageRouter.post("/image/generate", async (req, res) => {
	const { prompt } = req.body
	console.log(prompt)

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

	const imageMetadata = await imageService.getImage(id)
	if (!imageMetadata) {
		return res.status(404).json({ error: "Image not found" })
	}
	console.log(imageMetadata)
	const filePath = path.resolve(config.comfyUiOutputPath + "/" + imageMetadata.fileName)
	console.log(" Serving ", filePath)
	return res.sendFile(filePath)
})

imageRouter.delete("/image/:id", async (req, res) => {
	const { id } = req.params
})

imageRouter.get("/images", async (req, res) => {
	// This could return a list of all generated images, or perhaps just the metadata (id, url) for each image
})
