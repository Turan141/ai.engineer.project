import type { InMemoryVectorStore } from "../services/vector.store.service.js"
import type { IDocumentLoader, ITextSplitter } from "./types.js"

export class KnowledgeBase {
	constructor(
		private readonly loader: IDocumentLoader,
		private readonly splitter: ITextSplitter,
		private readonly vectorStore: InMemoryVectorStore
	) {}

	async ingest(folderPath: string): Promise<void> {
		const documents = await this.loader.loadDocuments(folderPath)

		for (const doc of documents) {
			const chunks = this.splitter.split(doc)

			for (const chunk of chunks) {
				await this.vectorStore.addDocument({ id: chunk.id, content: chunk.content })
			}
		}
	}
}
