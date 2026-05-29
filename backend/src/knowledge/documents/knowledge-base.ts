import type { IVectorStore } from "../../types/chat.types.js"
import type { IDocumentLoader, ITextSplitter } from "../types.js"

export class KnowledgeBase {
	constructor(
		private readonly loader: IDocumentLoader,
		private readonly splitter: ITextSplitter,
		private readonly vectorStore: IVectorStore
	) {}

	async ingest(file: Express.Multer.File): Promise<void> {
		const documents = await this.loader.loadDocuments(file)

		for (const doc of documents) {
			const chunks = this.splitter.split(doc)
			for (const chunk of chunks) {
				await this.vectorStore.addDocument({
					id: chunk.id,
					content: chunk.content,
					source: chunk.source,
					embedding: [], // Embedding will be generated in the vector store service
					metadata: {
						title: doc.source,
						chunkIndex: chunk.chunkIndex
					}
				})
			}
		}
	}

	async deleteAllKnowledge(): Promise<void> {
		const fs = await import("fs/promises")
		const path = await import("path")

		this.vectorStore.clearAllKnowledge()

		const uploadsDir = path.resolve(process.cwd(), "uploads")
		try {
			const files = await fs.readdir(uploadsDir)
			await Promise.all(files.map((file) => fs.unlink(path.join(uploadsDir, file))))
		} catch (error) {
			console.error("Error deleting knowledge files:", error)
			throw new Error("Failed to delete knowledge")
		}
	}
}
