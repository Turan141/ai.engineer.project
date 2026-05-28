import { Router } from "express"
import multer from "multer"
import { documentService } from "../bootstrap/dependencies.js"

export const documentRouter = Router()

const upload = multer({
	// storage: multer.memoryStorage()
	storage: multer.diskStorage({
		destination: "uploads/",
		filename: (_, file, cb) => {
			cb(null, file.originalname)
		}
	})
})

documentRouter.post("/document/ocr", upload.single("file"), async (req, res) => {
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
})
