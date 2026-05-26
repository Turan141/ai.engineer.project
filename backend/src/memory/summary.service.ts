import type { LLMService } from "../services/llm.service.js"
import type { IChatMessage } from "../types/chat.types.js"
import { buildSummaryPrompt } from "../utils/prompt_builder.js"
import type { ISummaryService } from "./types.js"

export class SummaryService implements ISummaryService {
	constructor(private readonly llmService: LLMService) {}

	async generateSummary(
		currentSummary: string | null,
		messages: IChatMessage[]
	): Promise<string> {
		const summaryPrompt = buildSummaryPrompt(currentSummary, messages)
		const llmResponse = await this.llmService.generate({
			messages: [
				{
					role: "system",
					content: "You are a helpful assistant that summarizes conversations."
				},
				{ role: "user", content: summaryPrompt }
			]
		})

		return llmResponse.content
	}
}
