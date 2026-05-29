import type { IKeywordStore } from "../../../shared/interfaces/vector-store.interface.js"
import { logger } from "../../../shared/logger.js"
import type { ISearchResult, IVectorStore } from "../../../types/chat.types.js"

export class HybridSearchService {
	constructor(
		private readonly vectorStore: IVectorStore,
		private readonly keywordStore: IKeywordStore
	) {}

	async search(query: string, topK: number): Promise<ISearchResult[]> {
		const [keywordResults, vectorResults] = await Promise.all([
			this.keywordStore.search(query, topK),
			this.vectorStore.search(query, topK)
		])

		const combinedResultsMap = new Map<string, ISearchResult>()

		keywordResults.forEach((result) => {
			combinedResultsMap.set(result.document.id, result)
		})

		vectorResults.forEach((result) => {
			if (!combinedResultsMap.has(result.document.id)) {
				combinedResultsMap.set(result.document.id, result)
			}
		})

		const results = Array.from(combinedResultsMap.values()).slice(0, topK)

		logger.info(
			{
				query,
				vectorIds: vectorResults.map((x) => x.document.id),
				keywordIds: keywordResults.map((x) => x.document.id),
				finalIds: results.map((x) => x.document.id),
				vectorCount: vectorResults.length,
				keywordCount: keywordResults.length,
				finalCount: results.length
			},
			"hybrid:search"
		)

		return results
	}
}
