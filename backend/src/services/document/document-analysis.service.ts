import { promptBuilderService } from "../../bootstrap/dependencies.js"
import type { IChatMessage } from "../../types/chat.types.js"
import type { LLMService } from "../llm/llm.service.js"

export class DocumentAnalysisService {
	constructor(private readonly llmService: LLMService) {}

	async analyzeDocument(text: string): Promise<IChatMessage> {
		const analysisPrompt = promptBuilderService.buildDocumentAnalysisPrompt(text)
		return await this.llmService.generate({
			messages: [
				{
					role: "system",
					content: "You are an assistant that analyzes documents and provides insights."
				},
				{
					role: "user",
					content: analysisPrompt
				}
			]
		})
	}
}
