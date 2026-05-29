import type {
	IKeywordStore,
	ISearchResult
} from "../../shared/interfaces/vector-store.interface.js"
import type { SQLiteService } from "./sqlite.service.js"

export class SQLiteKeywordRepository implements IKeywordStore {
	constructor(private readonly sqliteService: SQLiteService) {}

	async search(query: string, topK: number): Promise<ISearchResult[]> {
		const rows = this.sqliteService
			.getDb()
			.prepare(
				`
					SELECT
						id,
						content,
						document_id
					FROM document_chunks
					WHERE content LIKE ?
					ORDER BY created_at DESC
					LIMIT ?
				`
			)
			.all(`%${query}%`, topK) as {
			id: string
			content: string
			document_id: string
		}[]

		return rows.map((row) => ({
			document: {
				id: row.id,
				source: row.document_id,
				content: row.content,
				embedding: [], // Since this is a keyword search, we don't have embeddings
				metadata: { chunkIndex: 0, title: "" } // No additional metadata for keyword search
			},
			score: 1 // Since this is a keyword search, we can assign a default score
		}))
	}
}
