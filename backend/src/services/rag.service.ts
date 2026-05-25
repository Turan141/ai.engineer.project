import type {
	IChatMessage,
	IRAGResponse,
	IRetrievalStrategy,
	IVectorStore
} from "../types/chat.types.js"
import { buildRagPrompt, buildSystemPrompt } from "../utils/prompt_builder.js"
import type { LLMService } from "./llm.service.js"

const MAX_CONTEXT_DOCUMENTS = 3

export class RAGService {
	constructor(
		private readonly vectorStore: IVectorStore,
		private readonly llmService: LLMService,
		private readonly retrievalFilter: IRetrievalStrategy
	) {}

	async *askStream(
		messages: IChatMessage[],
		signal: AbortSignal
	): AsyncIterable<{ text: string }> {
		const lastUserMessage =
			messages.filter((msg) => msg.role === "user").at(-1)?.content ?? ""

		const searchResults = await this.vectorStore.search(
			lastUserMessage,
			MAX_CONTEXT_DOCUMENTS
		)

		console.log("QUESTION:", lastUserMessage)
		console.log("Search results:", searchResults)

		const contextDocuments = this.retrievalFilter.filter(searchResults)

		if (!contextDocuments.length) {
			yield {
				text: "I don't have enough information in the knowledge base."
			}
			return
		}

		const ragPrompt = buildRagPrompt(
			lastUserMessage,
			contextDocuments.map((s) => s.document.content).join("\n")
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
	}
}
