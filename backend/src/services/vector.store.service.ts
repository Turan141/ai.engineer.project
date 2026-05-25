import type {
	IEmbeddingProvider,
	ISearchResult,
	IVectorDocument,
	IVectorStore
} from "../types/chat.types.js"
import { cosineSimilarity } from "../utils/cosine-similarity.js"

export class InMemoryVectorStore implements IVectorStore {
	private documents: IVectorDocument[] = []

	constructor(private readonly embeddingProvider: IEmbeddingProvider) {}

	async addDocument(document: IVectorDocument): Promise<void> {
		const queryEmbedding = await this.embeddingProvider.generateEmbedding(
			document.content
		)

		this.documents.push({
			...document,
			embedding: queryEmbedding
		})
	}

	async search(query: string, topK: number): Promise<ISearchResult[]> {
		const queryEmbedding = await this.embeddingProvider.generateEmbedding(query)

		const similarity = this.documents
			.map((document) => {
				if (!document.embedding) {
					return {
						document,
						score: 0
					}
				}
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
