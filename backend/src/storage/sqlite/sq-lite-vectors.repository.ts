import type {
	IVectorStore,
	IEmbeddingProvider,
	IVectorDocument,
	ISearchResult
} from "../../types/chat.types.js"
import { cosineSimilarity } from "../../utils/cosine-similarity.js"
import type { SQLiteService } from "./sqlite.service.js"

export class SQLiteVectorRepository implements IVectorStore {
	constructor(
		private readonly sqliteService: SQLiteService,
		private readonly embeddingProvider: IEmbeddingProvider
	) {}

	async addDocument(params: IVectorDocument): Promise<void> {
		const { id, content, source, metadata } = params
		const embedding = await this.embeddingProvider.generateEmbedding(content)

		const result = this.sqliteService
			.getDb()
			.prepare(
				`INSERT INTO document_chunks (id, document_id, content, created_at)
                      VALUES (?, ?, ?, ?)`
			)
			.run(id, source, content, Date.now())

		this.sqliteService
			.getDb()
			.prepare(`INSERT INTO chunk_embeddings (rowid, embedding) VALUES (?, ?)`)
			.run(result.lastInsertRowid, JSON.stringify(embedding))
	}

	async search(query: string, topK: number = 5): Promise<ISearchResult[]> {
		const embedding = await this.embeddingProvider.generateEmbedding(query)

		const rows = this.sqliteService
			.getDb()
			.prepare(
				`
            SELECT dc.id, dc.content, dc.document_id, ce.embedding
            FROM chunk_embeddings ce
            JOIN document_chunks dc ON dc.rowid = ce.rowid
            WHERE vss_search(ce.embedding, ?)
            LIMIT ?
        `
			)
			.all(JSON.stringify(embedding), topK) as any[]

		// Маппинг в ISearchResult
		return rows.map((row) => ({
			document: {
				id: row.id,
				content: row.content,
				source: row.document_id,
				embedding: [],
				metadata: { title: row.document_id, chunkIndex: 0 }
			},
			score: cosineSimilarity(embedding, JSON.parse(row.embedding))
		}))
	}
}
