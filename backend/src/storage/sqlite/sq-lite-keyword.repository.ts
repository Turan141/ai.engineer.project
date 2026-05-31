import type {
	IKeywordStore,
	ISearchResult
} from "../../shared/interfaces/vector-store.interface.js"
import type { SQLiteService } from "./sqlite.service.js"

export class SQLiteKeywordRepository implements IKeywordStore {
	constructor(private readonly sqliteService: SQLiteService) {}

	async addDocument(document: any): Promise<void> {
		this.sqliteService
			.getDb()
			.prepare(
				`
					INSERT INTO document_chunks_fts (chunk_id, document_id, content)
					VALUES (?, ?, ?)
				`
			)
			.run(document.id, document.source, document.content)
	}

	async clearAllKnowledge(): Promise<void> {
		this.sqliteService.getDb().prepare(`DELETE FROM document_chunks_fts`).run()
	}

	private sanitizeFtsQuery(query: string): string {
		return query
			.trim()
			.split(/\s+/)
			.filter(Boolean)
			.map((word) => `"${word.replace(/"/g, '""')}"`)
			.join(" OR ")
	}

	async search(query: string, topK: number): Promise<ISearchResult[]> {
		const ftsQuery = this.sanitizeFtsQuery(query)
		const rows = this.sqliteService
			.getDb()
			.prepare(
				`
					SELECT
						chunk_id,
						document_id,
						content,
						bm25(document_chunks_fts) AS rank
					FROM document_chunks_fts
					WHERE document_chunks_fts MATCH ?
					ORDER BY rank
					LIMIT ?
				`
			)
			.all(ftsQuery, topK) as {
			chunk_id: string
			document_id: string
			content: string
			rank: number
		}[]

		return rows.map((row) => ({
			document: {
				id: row.chunk_id,
				source: row.document_id,
				content: row.content,
				embedding: [], // Since this is a keyword search, we don't have embeddings
				metadata: { chunkIndex: +row.chunk_id, title: "" } // No additional metadata for keyword search
			},
			score: row.rank
		}))
	}
}
