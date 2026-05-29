import { Router } from "express"
import { documentService, knowledgeBase } from "../bootstrap/dependencies.js"
import { createUpload } from "../utils/file-uploader.js"

export const documentRouter = Router()

documentRouter.post(
	"/document/uploadKnowledge",
	createUpload("knowledge").single("file"),
	async (req, res) => {
		try {
			const { file } = req

			if (!file) {
				return res.status(400).json({ error: "File is required for knowledge ingestion" })
			}
			await knowledgeBase.ingest(file)
			res.json({ success: true, message: "Document ingested successfully" })
		} catch (error) {
			console.error("Error ingesting document:", error)
			return res.status(500).json({ error: "Failed to ingest document" })
		}
	}
)

documentRouter.delete("/document/deleteAllKnowledge", async (req, res) => {
	try {
		await knowledgeBase.deleteAllKnowledge()
		res.json({ success: true, message: "All knowledge deleted successfully" })
	} catch (error) {
		console.error("Error deleting knowledge:", error)
		return res.status(500).json({ error: "Failed to delete knowledge" })
	}
})

documentRouter.get("/document/hisotry", async (req, res) => {
	const documents = await knowledgeBase.getIngestedDocuments()
	res.json({ success: true, documents: [] })
})

documentRouter.post(
	"/document/ocr",
	createUpload("ocr").single("file"),
	async (req, res) => {
		try {
			const { file } = req
			if (!file) {
				return res.status(400).json({ error: "File is required for OCR processing" })
			}

			if (!req.file) {
				return res.status(400).json({ error: "File is required for OCR processing" })
			}

			const text = await documentService.processDocument(req.file.path)

			if (!text) {
				return res.status(500).json({ error: "OCR processing failed to extract text" })
			}

			res.json({ success: true, text })
		} catch (error) {
			console.error("Error processing OCR:", error)
			return res.status(500).json({ error: "Failed to process OCR" })
		}
	}
)
