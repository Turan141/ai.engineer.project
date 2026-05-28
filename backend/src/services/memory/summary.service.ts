import { promptBuilderService } from "../../bootstrap/dependencies.js"
import type { ILLMService } from "../../shared/interfaces/llm.interface.js"
import type { IChatMessage } from "../../types/chat.types.js"
import type { ISummaryService } from "./types.js"

export class SummaryService implements ISummaryService {
	constructor(private readonly llmService: ILLMService) {}

	async generateSummary(
		currentSummary: string | null,
		messages: IChatMessage[]
	): Promise<string> {
		const summaryPrompt = promptBuilderService.buildSummaryPrompt(
			currentSummary,
			messages
		)
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
