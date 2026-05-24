import type { IDocument, IDocumentLoader } from "./types.js"
import path from "path"
import { promises as fs } from "fs"

export class FileSystemDocumentLoader implements IDocumentLoader {
	private readonly supportedExtensions = [".md"]

	async loadDocuments(folderPath: string): Promise<IDocument[]> {
		let stats = null

		try {
			stats = await fs.stat(folderPath)
		} catch {
			throw new Error(`Directory not found: ${folderPath}`)
		}

		if (!stats.isDirectory()) {
			throw new Error(`Provided path is not a directory: ${folderPath}`)
		}

		const files = await fs.readdir(folderPath)

		const markdownFiles = files.filter((file) =>
			this.supportedExtensions.includes(path.extname(file))
		)

		if (!markdownFiles || markdownFiles.length === 0) {
			throw new Error(`No supported document files found in directory: ${folderPath}`)
		}

		return Promise.all(
			markdownFiles.map(async (file) => {
				const content = await fs.readFile(path.join(folderPath, file), "utf-8")

				return {
					id: path.basename(file, path.extname(file)),
					content,
					source: file
				}
			})
		)
	}
}
