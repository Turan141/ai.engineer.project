import { retrievalEvaluationService } from "../bootstrap/dependencies.js"
import type { RetrievalEvaluationService } from "../services/retrieval-evaluation/retrieval-evaluation.service.js"
import type { IRetrievalTestCase } from "../types/chat.types.js"

// Software Architecture
// Dependency Injection
// Provider Pattern
// Context API
// Node.js
// React
// Chunking
// Chunk Overlap
// Embeddings
// Vector Search
// Sergey
// Наим
// LM Studio
// AI Gateway
// Persistent Storage
export const retrievalTestCases: IRetrievalTestCase[] = [
	{
		query: "Software Architecture",
		expectedChunkIds: ["knowledge-base-test.md_chunk_5"]
	},
	{
		query: "кто такой сергей",
		expectedChunkIds: ["knowledge-base-test.md_chunk_7"]
	},
	{
		query: "что такое наим",
		expectedChunkIds: ["knowledge-base-test.md_chunk_6"]
	},
	{
		query: "что такое LM Studio",
		expectedChunkIds: ["knowledge-base-test.md_chunk_8"]
	}
]

export const testRetrieval = async (
	service: RetrievalEvaluationService
): Promise<void> => {
	for (const testCase of retrievalTestCases) {
		const result = await service.evaluateTestCase(testCase)

		console.log("\n===================================")
		console.log("QUERY:", result.query)
		console.log("===================================\n")

		result.foundChunks.forEach((chunk, index) => {
			console.log({
				rank: index + 1,
				id: chunk.document.id,
				content: chunk.document.content.slice(0, 200)
			})
		})

		console.log("\nRecall:", result.recallAtK)
		console.log("Precision:", result.precisionAtK)
	}
}
