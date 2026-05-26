import { promptBuilderService } from "../../bootstrap/dependencies.js"
import type {
	IChatMessage,
	IRAGResponse,
	IRetrievalStrategy,
	IVectorStore
} from "../../types/chat.types.js"
import type { LLMService } from "../llm/llm.service.js"

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

		const contextDocuments = this.retrievalFilter.filter(searchResults)

		if (!contextDocuments.length) {
			// If no relevant documents found, just generate a normal response without context
			const stream = await this.llmService.generateStream({ messages }, signal)
			yield* stream
			return
		}

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
	}
}
