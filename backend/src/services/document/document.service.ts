import type { SQLiteDocumentRepository } from "../../storage/sqlite/sqlite-document.repository.js"
import type {
	IDocumentAnalysisResult,
	IDocumentAnalysisService,
	IDocumentOCRService
} from "../../types/chat.types.js"

export class DocumentService {
	constructor(
		private readonly documentAnalysisService: IDocumentAnalysisService,
		private readonly documentOcrService: IDocumentOCRService,
		private readonly documentRepository: SQLiteDocumentRepository
	) {}

	async getDocuments(): Promise<
		Array<{
			id: string
			source: string
			raw_text: string
			analysis: string
			created_at: number
		}>
	> {
		return this.documentRepository.getDocuments()
	}

	async processDocument(filePath: string): Promise<{
		rawText: string
		analysis: IDocumentAnalysisResult
	}> {
		const rawText = await this.documentOcrService.extractText(filePath)
		const analysis = await this.documentAnalysisService.analyzeDocument(rawText)
		this.documentRepository.addDocument(filePath, rawText, analysis)

		return {
			rawText,
			analysis
		}
	}
}
