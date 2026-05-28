import type {
	IDocumentAnalysisService,
	IDocumentOCRService
} from "../../types/chat.types.js"

export class DocumentService {
	constructor(
		private readonly documentAnalysisService: IDocumentAnalysisService,
		private readonly documentOcrService: IDocumentOCRService
	) {}

	async processDocument(filePath: string): Promise<{ text: string; analysis: string }> {
		const text = await this.documentOcrService.extractText(filePath)
		const analysisMessage = await this.documentAnalysisService.analyzeDocument(text)
		return {
			text,
			analysis: analysisMessage.content
		}
	}
}
