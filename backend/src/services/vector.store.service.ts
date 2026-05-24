import type {
	IEmbeddingProvider,
	ISearchResult,
	IVectorDocument,
	IAddDocumentRequest
} from "../types/chat.types.js"
import { cosineSimilarity } from "../utils/cosine-similarity.js"

export class InMemoryVectorStore {
	private documents: IVectorDocument[] = []

	constructor(private readonly embeddingProvider: IEmbeddingProvider) {}

	async addDocument(document: IAddDocumentRequest): Promise<void> {
		const queryEmbedding = await this.embeddingProvider.generateEmbedding(document.text)

		this.documents.push({
			content: document.text,
			id: document.index.toString(),
			embedding: queryEmbedding
		})
	}

	async search(query: string, topK: number): Promise<ISearchResult[]> {
		const queryEmbedding = await this.embeddingProvider.generateEmbedding(query)

		const similarity = this.documents
			.map((document) => {
				return {
					document,
					score: cosineSimilarity(document.embedding, queryEmbedding)
				}
			})
			.sort((a, b) => b.score - a.score)
			.slice(0, topK)

		return similarity
	}
}
