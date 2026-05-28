import type {
	IDocumentAnalysisResult,
	IDocumentAnalysisService,
	IDocumentOCRService
} from "../../types/chat.types.js"

export class DocumentService {
	constructor(
		private readonly documentAnalysisService: IDocumentAnalysisService,
		private readonly documentOcrService: IDocumentOCRService
	) {}

	async processDocument(filePath: string): Promise<{
		rawText: string
		analysis: IDocumentAnalysisResult
	}> {
		const rawText = await this.documentOcrService.extractText(filePath)
		const analysis = await this.documentAnalysisService.analyzeDocument(rawText)

		return {
			rawText,
			analysis
		}
	}
}
