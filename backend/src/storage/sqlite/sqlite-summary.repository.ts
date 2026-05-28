import type { ISummaryRepository } from "../../services/memory/types.js"
import type { SQLiteService } from "../sqlite/sqlite.service.js"

export class SQLiteSummaryRepository implements ISummaryRepository {
	constructor(private readonly sqliteService: SQLiteService) {}

	clear(sessionId: string): Promise<void> {
		const stmt = this.sqliteService.getDb().prepare(`
        DELETE FROM summaries
        WHERE session_id = ?
    `)
		stmt.run(sessionId)
		return Promise.resolve()
	}

	async addSummary(sessionId: string, summary: string): Promise<void> {
		const stmt = this.sqliteService.getDb().prepare(`
            INSERT INTO summaries (
            session_id,
            summary,
            updated_at
            )
            VALUES (?, ?, ?)
            ON CONFLICT(session_id)
            DO UPDATE SET
            summary = excluded.summary,
            updated_at = excluded.updated_at
          `)
		stmt.run(sessionId, summary, new Date().toISOString())
	}

	async getSummary(sessionId: string): Promise<string | null> {
		const stmt = this.sqliteService.getDb().prepare(`
            SELECT summary
            FROM summaries
            WHERE session_id = ?
          `)
		const result = stmt.get(sessionId) as 5 | { summary: string } | undefined
		return result === 5 ? null : result?.summary || null
	}
}
