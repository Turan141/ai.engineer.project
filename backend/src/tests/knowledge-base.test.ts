import "dotenv/config"

import { InMemoryVectorStore } from "../services/vector.store.service.js"
import { FileSystemDocumentLoader } from "../knowledge/document-loader.js"
import { KnowledgeBase } from "../knowledge/knowledge-base.js"
import { LMStudioEmbeddingService } from "../services/ai_services/lmstudio.embedding.service.js"
import { RecursiveTextSplitter } from "../knowledge/recursitve-text-splitter.js"

async function main(): Promise<void> {
	console.log("Creating services...")

	const embeddingProvider = new LMStudioEmbeddingService()
	const vectorStore = new InMemoryVectorStore(embeddingProvider)
	const loader = new FileSystemDocumentLoader()
	const splitter = new RecursiveTextSplitter()
	const knowledgeBase = new KnowledgeBase(loader, splitter, vectorStore)

	console.log("Ingesting documents...")

	await knowledgeBase.ingest("./docs")

	console.log("Documents ingested")

	const questions = [
		"What is React?",
		"What does useEffect do?",
		"What is cosine similarity?",
		"What is RAG?",
		"Why is dependency injection useful?"
	]

	for (const question of questions) {
		console.log("\n=================================")
		console.log(`QUESTION: ${question}`)

		const results = await vectorStore.search(question, 3)

		results.forEach((result, index) => {
			console.log(`\nResult ${index + 1}`)

			console.log(`Score: ${result.score.toFixed(4)}`)

			console.log(`Source: ${result.document.source}`)

			console.log(`Document ID: ${result.document.id}`)

			console.log(`Metadata: ${JSON.stringify(result.document.metadata)}`)

			console.log(`Content:`)

			console.log(result.document.content.slice(0, 200))
		})
	}
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
