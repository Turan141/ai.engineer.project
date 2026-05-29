import type { IDocument, IDocumentLoader } from "../types.js"
import path from "path"
import { promises as fs } from "fs"

export class FileSystemDocumentLoader implements IDocumentLoader {
	private readonly supportedExtensions = [".md", ".pdf", ".txt"]

	async loadDocuments(file: Express.Multer.File): Promise<IDocument[]> {
		const ext = path.extname(file.originalname).toLowerCase()

		if (!this.supportedExtensions.includes(ext)) {
			throw new Error(
				`Unsupported file type: ${ext}. Supported: ${this.supportedExtensions.join(", ")}`
			)
		}

		const content = await fs.readFile(file.path, "utf-8")

		return [
			{
				id: file.filename,
				content,
				source: file.originalname
			}
		]
	}
}
