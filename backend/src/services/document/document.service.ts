import type { SQLiteDocumentRepository } from "../../storage/sqlite/sqlite-document.repository.js"
import { createLogger } from "../../shared/logger.js"
import type {
	IDocumentAnalysisResult,
	IDocumentAnalysisService,
	IDocumentOCRService
} from "../../types/chat.types.js"

const log = createLogger("DocumentService")

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
		const t0 = Date.now()
		log.info({ filePath }, "doc:process:start")

		const t1 = Date.now()
		const rawText = await this.documentOcrService.extractText(filePath)
		log.info({ filePath, chars: rawText.length, ocrMs: Date.now() - t1 }, "doc:ocr:done")

		const t2 = Date.now()
		const analysis = await this.documentAnalysisService.analyzeDocument(rawText)
		log.info({ filePath, analysisMs: Date.now() - t2 }, "doc:analysis:done")

		await this.documentRepository.addDocument(filePath, rawText, analysis)

		log.info({ filePath, totalMs: Date.now() - t0 }, "doc:process:done")

		return {
			rawText,
			analysis
		}
	}
}
