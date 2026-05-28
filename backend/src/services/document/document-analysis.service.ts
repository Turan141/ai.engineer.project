import { promptBuilderService } from "../../bootstrap/dependencies.js"
import type { IDocumentAnalysisResult } from "../../types/chat.types.js"
import type { LLMService } from "../llm/llm.service.js"

export class DocumentAnalysisService {
	constructor(private readonly llmService: LLMService) {}

	async analyzeDocument(text: string): Promise<IDocumentAnalysisResult> {
		const analysisPrompt = promptBuilderService.buildDocumentAnalysisPrompt(text)

		const response = await this.llmService.generate({
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

		try {
			return JSON.parse(response.content) as IDocumentAnalysisResult
		} catch (error) {
			console.error("Failed to parse document analysis response:", error)
			throw new Error("Document analysis failed: Invalid response format")
		}
	}
}
