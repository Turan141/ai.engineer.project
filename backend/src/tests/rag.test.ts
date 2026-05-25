import "dotenv/config"

import { inMemoryVectorStore, ragService } from "../services/llm.service.js"
import { seedDocuments } from "./seed-documents.js"

async function main(): Promise<void> {
	const results = await inMemoryVectorStore.search("What is React?", 2)

	if (results[0]) console.log(results[0].document.source)
	console.log("Loading documents...")

	await seedDocuments()

	console.log("Documents loaded")
	console.log()

	const questions = [
		"What is Aegis?",
		"What does Aegis use for semantic search?",
		"What LLM provider does Aegis use?",
		"What is RAG?",
		"How are embeddings generated?"
	]

	for (const question of questions) {
		try {
			console.log("=".repeat(80))
			console.log("QUESTION:")
			console.log(question)
			console.log()

			const response = await ragService.ask(question)

			console.log("ANSWER:")
			console.log(response.answer)
			console.log()

			console.log("SOURCES:")
			console.table(
				response.context.map((doc) => ({
					id: doc.document.id,
					score: doc.score
				}))
			)
		} catch (error) {
			console.error("FAILED QUESTION:")
			console.error(question)
			console.error(error)
		}
	}
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
