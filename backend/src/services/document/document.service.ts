import type { DocumentAnalysisService } from "./document-analysis.service.js"
import type { DocumentOCRService } from "./document-ocr.service.js"

export class DocumentService {
	constructor(
		private readonly documentAnalysisService: DocumentAnalysisService,
		private readonly documentOcrService: DocumentOCRService
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
