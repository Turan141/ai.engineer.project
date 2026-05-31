import type { IKeywordStore } from "../../shared/interfaces/vector-store.interface.js"
import type { IVectorStore } from "../../types/chat.types.js"
import type { IDocumentLoader, ITextSplitter } from "../types.js"

export class KnowledgeBase {
	constructor(
		private readonly loader: IDocumentLoader,
		private readonly splitter: ITextSplitter,
		private readonly vectorStore: IVectorStore,
		private readonly keywordStore: IKeywordStore
	) {}

	async ingest(file: Express.Multer.File): Promise<void> {
		const documents = await this.loader.loadDocuments(file)

		for (const doc of documents) {
			const chunks = this.splitter.split(doc)
			for (const chunk of chunks) {
				await this.keywordStore.addDocument({
					id: chunk.id,
					content: chunk.content,
					source: chunk.source,
					embedding: [], // Embedding will be generated in the keyword store service if needed
					metadata: {
						title: doc.source,
						chunkIndex: chunk.chunkIndex
					}
				})

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

		await this.vectorStore.clearAllKnowledge()
		await this.keywordStore.clearAllKnowledge()

		const uploadsDir = path.resolve(process.cwd(), "uploads/knowledge")
		try {
			const files = await fs.readdir(uploadsDir)
			await Promise.all(files.map((file) => fs.unlink(path.join(uploadsDir, file))))
		} catch (error) {
			console.error("Error deleting knowledge files:", error)
			throw new Error("Failed to delete knowledge")
		}
	}
}
