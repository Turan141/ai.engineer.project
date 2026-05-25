import type { IRAGResponse, IVectorStore } from "../types/chat.types.js"
import { buildRagPrompt } from "../utils/prompt_builder.js"
import type { LLMService } from "./llm.service.js"

const SIMILARITY_THRESHOLD = 0.5
const MAX_CONTEXT_DOCUMENTS = 3

export class RAGService {
	constructor(
		private readonly vectorStore: IVectorStore,
		private readonly llmService: LLMService
	) {}

	async ask(question: string): Promise<IRAGResponse> {
		const contextDocuments = (
			await this.vectorStore.search(question, MAX_CONTEXT_DOCUMENTS)
		).filter((similarity) => similarity.score >= SIMILARITY_THRESHOLD)

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
