import { Router } from "express"
import { sqLiteService } from "../bootstrap/dependencies.js"

export const debugRouter = Router()

debugRouter.get("/debug/chunks", (_req, res) => {
	const db = sqLiteService.getDb()

	const chunks = db
		.prepare(
			`SELECT
        id,
        document_id,
        substr(content, 1, 100) AS preview,
        created_at
      FROM document_chunks
      ORDER BY created_at DESC`
		)
		.all() as Array<{
		id: string
		document_id: string
		preview: string
		created_at: number
	}>

	return res.json({
		total: chunks.length,
		chunks
	})
})
