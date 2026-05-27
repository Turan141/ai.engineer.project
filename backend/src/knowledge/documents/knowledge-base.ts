import type { IVectorStore } from "../../types/chat.types.js"
import type { IDocumentLoader, ITextSplitter } from "../types.js"

export class KnowledgeBase {
	constructor(
		private readonly loader: IDocumentLoader,
		private readonly splitter: ITextSplitter,
		private readonly vectorStore: IVectorStore
	) {}

	async initialize(): Promise<void> {
		await this.ingest("./docs")
	}

	async ingest(folderPath: string): Promise<void> {
		const documents = await this.loader.loadDocuments(folderPath)

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
}
