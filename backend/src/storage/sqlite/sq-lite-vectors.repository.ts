import type {
	IVectorStore,
	IEmbeddingProvider,
	IVectorDocument,
	ISearchResult
} from "../../types/chat.types.js"
import type { SQLiteService } from "./sqlite.service.js"
import { createLogger } from "../../shared/logger.js"

const log = createLogger("VectorRepository")

export class SQLiteVectorRepository implements IVectorStore {
	constructor(
		private readonly sqliteService: SQLiteService,
		private readonly embeddingProvider: IEmbeddingProvider
	) {}

	async addDocument(params: IVectorDocument): Promise<void> {
		const { id, content, source, metadata } = params

		const t0 = Date.now()
		const embedding = await this.embeddingProvider.generateEmbedding(content)
		log.debug(
			{ source, contentLength: content.length, embeddingMs: Date.now() - t0 },
			"embed:done"
		)

		const result = this.sqliteService
			.getDb()
			.prepare(
				`INSERT OR REPLACE INTO document_chunks (id, document_id, content, created_at)
                      VALUES (?, ?, ?, ?)`
			)
			.run(id, source, content, Date.now())

		this.sqliteService
			.getDb()
			.prepare(`INSERT INTO chunk_embeddings (rowid, embedding) VALUES (?, ?)`)
			.run(BigInt(result.lastInsertRowid), new Float32Array(embedding))
	}

	async clearAllKnowledge(): Promise<void> {
		this.sqliteService.getDb().prepare(`DELETE FROM document_chunks`).run()
		this.sqliteService.getDb().prepare(`DELETE FROM chunk_embeddings`).run()
	}

	async search(query: string, topK: number = 5): Promise<ISearchResult[]> {
		const t0 = Date.now()
		const embedding = await this.embeddingProvider.generateEmbedding(query)
		const embedMs = Date.now() - t0

		const t1 = Date.now()
		const rows = this.sqliteService
			.getDb()
			.prepare(
				`
          SELECT
            dc.id,
            dc.content,
            dc.document_id,
            distance
          FROM chunk_embeddings ce
          JOIN document_chunks dc
            ON dc.rowid = ce.rowid
          WHERE ce.embedding MATCH ?
            AND k = ${topK}
          ORDER BY distance
        `
			)
			.all(JSON.stringify(embedding)) as Array<{
			id: string
			content: string
			document_id: string
			distance: number
		}>

		log.info(
			{
				topK,
				results: rows.length,
				embedMs,
				searchMs: Date.now() - t1
			},
			"vector:search"
		)

		return rows.map((row) => ({
			document: {
				id: row.id,
				content: row.content,
				source: row.document_id,
				embedding: [],
				metadata: { title: row.document_id, chunkIndex: 0 }
			},
			score: row.distance
		}))
	}
}
