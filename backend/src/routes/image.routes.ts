import { Router } from "express"
import { imageService } from "../bootstrap/dependencies.js"
import { config } from "../config/config.js"
import path from "path"

export const imageRouter = Router()

const validatePrompt = (prompt: any): string | null => {
	if (typeof prompt !== "string" || prompt.trim() === "") {
		return "Prompt is required for image generation"
	}
	return null
}

class ImageController {
	async generateImage(req: any, res: any) {
		const { prompt } = req.body
		const error = validatePrompt(prompt)
		if (error) {
			return res.status(400).json({ error })
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
	}

	async getImage(req: any, res: any) {
		const { id } = req.params

		const imageMetadata = await imageService.getImage(id)
		if (!imageMetadata) {
			return res.status(404).json({ error: "Image not found" })
		}
		const filePath = path.resolve(config.comfyUiOutputPath + "/" + imageMetadata.fileName)
		return res.sendFile(filePath)
	}

	async deleteImage(req: any, res: any) {
		const { id } = req.params
		// Implement deletion logic here if needed
	}

	async listImages(req: any, res: any) {
		// This could return a list of all generated images, or perhaps just the metadata (id, url) for each image
	}
}

const imageController = new ImageController()

imageRouter.post("/image/generate", (req, res) => imageController.generateImage(req, res))
imageRouter.get("/image/:id", (req, res) => imageController.getImage(req, res))
imageRouter.delete("/image/:id", (req, res) => imageController.deleteImage(req, res))
imageRouter.get("/images", (req, res) => imageController.listImages(req, res))
