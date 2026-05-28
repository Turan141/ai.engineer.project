import type { IMessageRepository } from "../../services/memory/types.js"
import type { IChatMessage } from "../../types/chat.types.js"
import type { SQLiteService } from "../sqlite/sqlite.service.js"

export class SQLiteMessageRepository implements IMessageRepository {
	constructor(private readonly sqliteService: SQLiteService) {}

	async addMessage(sessionId: string, message: IChatMessage): Promise<void> {
		const stmt = this.sqliteService
			.getDb()
			.prepare(
				`INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ? ,?)`
			)

		stmt.run(
			crypto.randomUUID(),
			sessionId,
			message.role,
			message.content,
			new Date().toISOString()
		)
	}

	async trim(sessionId: string): Promise<void> {
		const stmt = this.sqliteService.getDb().prepare(`
      DELETE FROM messages
      WHERE id IN (
        SELECT id FROM messages
        WHERE session_id = ?
        ORDER BY created_at ASC
        LIMIT (
          SELECT COUNT(*) - ? FROM messages WHERE session_id = ?
        )
      )
    `)

		stmt.run(sessionId, 20, sessionId)
	}

	async getMessages(sessionId: string): Promise<IChatMessage[]> {
		const stmt = this.sqliteService.getDb().prepare(
			` SELECT role, content 
        FROM messages 
        WHERE session_id = ? 
        ORDER BY created_at ASC`
		)

		return stmt.all(sessionId) as IChatMessage[]
	}
}
