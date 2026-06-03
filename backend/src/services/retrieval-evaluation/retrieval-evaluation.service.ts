import { createLogger } from "../../shared/logger.js"
import { testRetrieval } from "../../tests/retrieval-cases.test.js"
import type { IEvaluationResult, IRetrievalTestCase } from "../../types/chat.types.js"
import type { HybridSearchService } from "../rag/retrieval/hybrid-search.service.js"

const logger = createLogger("RetrievalEvaluationService")

export class RetrievalEvaluationService {
	constructor(private readonly hybridSearch: HybridSearchService) {
		this.init()
	}

	init() {
		// testRetrieval(this)
	}

	private calculateRecall(foundIds: string[], expectedIds: string[]): number {
		const foundRelevant = expectedIds.filter((id) => foundIds.includes(id))
		return foundRelevant.length / expectedIds.length
	}
	private calculatePrecision(foundIds: string[], expectedIds: string[]): number {
		const relevantFound = foundIds.filter((id) => expectedIds.includes(id))
		return relevantFound.length / foundIds.length
	}
	async evaluateTestCase(
		testCase: IRetrievalTestCase,
		k = 5
	): Promise<IEvaluationResult> {
		const results = await this.hybridSearch.search(testCase.query, k)

		const foundIds = results.map((r) => r.document.id)

		return {
			query: testCase.query,
			recallAtK: this.calculateRecall(foundIds, testCase.expectedChunkIds),
			precisionAtK: this.calculatePrecision(foundIds, testCase.expectedChunkIds),
			foundChunkIds: foundIds,
			expectedChunkIds: testCase.expectedChunkIds,
			foundChunks: results
		}
	}
}
