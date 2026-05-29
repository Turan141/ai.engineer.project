import type { IDocumentAnalysisResult } from "../../types/chat.types.js"
import type { SQLiteService } from "./sqlite.service.js"

export class SQLiteDocumentRepository {
	constructor(private readonly sqliteService: SQLiteService) {}

	async getDocuments(): Promise<
		Array<{
			id: string
			source: string
			raw_text: string
			analysis: string
			created_at: number
		}>
	> {
		const stmt = this.sqliteService.getDb().prepare(`
      SELECT
        id,
        source,
        raw_text,
        analysis,
        created_at
      FROM documents_analyze
      ORDER BY created_at DESC
    `)

		return stmt.all() as Array<{
			id: string
			source: string
			raw_text: string
			analysis: string
			created_at: number
		}>
	}

	async addDocument(
		filePath: string,
		rawText: string,
		analysis: IDocumentAnalysisResult
	): Promise<void> {
		this.sqliteService
			.getDb()
			.prepare(
				`INSERT INTO documents_analyze (id, source, raw_text, analysis, created_at) VALUES (?, ?, ?, ?, ?)`
			)
			.run(crypto.randomUUID(), filePath, rawText, JSON.stringify(analysis), Date.now())
	}
}
