import { promptBuilderService } from "../../bootstrap/dependencies.js"
import { createLogger } from "../../shared/logger.js"
import type { ILLMService } from "../../shared/interfaces/llm.interface.js"
import type {
	IChatMessage,
	IRetrievalStrategy,
	IVectorStore
} from "../../types/chat.types.js"
import type { HybridSearchService } from "./retrieval/hybrid-search.service.js"

const MAX_CONTEXT_DOCUMENTS = 3
const log = createLogger("RAGService")

export class RAGService {
	constructor(
		private readonly hybridSearchService: HybridSearchService,
		private readonly llmService: ILLMService,
		private readonly retrievalFilter: IRetrievalStrategy
	) {}

	async *askStream(
		messages: IChatMessage[],
		signal: AbortSignal
	): AsyncIterable<{ text: string }> {
		const t0 = Date.now()
		const lastUserMessage =
			messages.filter((msg) => msg.role === "user").at(-1)?.content ?? ""

		const searchResults = await this.hybridSearchService.search(
			lastUserMessage,
			MAX_CONTEXT_DOCUMENTS
		)

		log.info(
			{
				query: lastUserMessage.slice(0, 120),
				searchResults: searchResults.length,
				scores: searchResults.map((r) => +r.score.toFixed(3))
			},
			"rag:search"
		)

		const contextDocuments = this.retrievalFilter.filter(searchResults)

		if (!contextDocuments.length) {
			log.info({ path: "direct", reason: "no_context_above_threshold" }, "rag:route")
			const stream = await this.llmService.generateStream({ messages }, signal)
			yield* stream
			log.info({ path: "direct", totalMs: Date.now() - t0 }, "rag:done")
			return
		}

		log.info(
			{
				path: "rag",
				contextDocs: contextDocuments.length,
				sources: contextDocuments.map((d) => d.document.source)
			},
			"rag:route"
		)

		const ragPrompt = promptBuilderService.buildRagPrompt(
			lastUserMessage,
			contextDocuments
		)

		const stream = await this.llmService.generateStream(
			{
				messages: [
					...messages.slice(0, -1),
					{
						role: "user",
						content: ragPrompt
					}
				]
			},
			signal
		)

		for await (const chunk of stream) {
			yield chunk
		}

		log.info({ path: "rag", totalMs: Date.now() - t0 }, "rag:done")
	}
}
