import type {
	IRAGResponse,
	IRetrievalStrategy,
	IVectorStore
} from "../types/chat.types.js"
import { buildRagPrompt } from "../utils/prompt_builder.js"
import type { LLMService } from "./llm.service.js"

const MAX_CONTEXT_DOCUMENTS = 3

export class RAGService {
	constructor(
		private readonly vectorStore: IVectorStore,
		private readonly llmService: LLMService,
		private readonly retrievalFilter: IRetrievalStrategy
	) {}

	async ask(question: string): Promise<IRAGResponse> {
		const searchResults = await this.vectorStore.search(question, MAX_CONTEXT_DOCUMENTS)
		const contextDocuments = this.retrievalFilter.filter(searchResults)

		if (!contextDocuments.length) {
			return {
				answer: "I don't have enough information in the knowledge base.",
				context: [],
				sources: []
			}
		}

		const prompt = buildRagPrompt(
			question,
			contextDocuments.map((s) => s.document.content).join("\n")
		)

		const answer = await this.llmService.generate({
			messages: [
				{
					role: "user",
					content: prompt
				}
			]
		})

		const sources = [...new Set(contextDocuments.map((doc) => doc.document.source))]

		return {
			answer: answer.content,
			context: contextDocuments,
			sources
		}
	}
}
