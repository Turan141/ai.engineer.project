import "dotenv/config"
import { InMemoryVectorStore } from "../services/vector.store.service.js"
import { LMStudioEmbeddingService } from "../services/ai_services/lmstudio.embedding.service.js"

async function main(): Promise<void> {
	const embeddingProvider = new LMStudioEmbeddingService()

	const store = new InMemoryVectorStore(embeddingProvider)

	await store.addDocument({
		id: "1",
		content: "React is a frontend library",
		source: "doc1",
		embedding: await embeddingProvider.generateEmbedding("React is a frontend library"),
		metadata: {
			chunkIndex: 0,
			title: "doc3"
		}
	})

	await store.addDocument({
		id: "2",
		content: "PostgreSQL is a relational database",
		source: "doc2",
		embedding: await embeddingProvider.generateEmbedding(
			"PostgreSQL is a relational database"
		),
		metadata: {
			chunkIndex: 0,
			title: "doc3"
		}
	})

	await store.addDocument({
		id: "3",
		content: "Football is the most popular sport in the world",
		source: "doc3",
		embedding: await embeddingProvider.generateEmbedding(
			"Football is the most popular sport in the world"
		),
		metadata: {
			chunkIndex: 0,
			title: "doc3"
		}
	})

	await store.addDocument({
		id: "4",
		content: "Basketball is played with five players per team",
		source: "doc4",
		embedding: await embeddingProvider.generateEmbedding(
			"Basketball is played with five players per team"
		),
		metadata: {
			chunkIndex: 0,
			title: "doc3"
		}
	})

	console.log("\n=== QUERY: soccer ===")

	const soccerResults = await store.search("soccer", 3)

	console.table(
		soccerResults.map((result) => ({
			id: result.document.id,
			content: result.document.content,
			score: result.score
		}))
	)

	console.log("\n=== QUERY: frontend framework ===")

	const frontendResults = await store.search("frontend framework", 3)

	console.table(
		frontendResults.map((result) => ({
			id: result.document.id,
			content: result.document.content,
			score: result.score
		}))
	)

	console.log("\n=== QUERY: database ===")

	const databaseResults = await store.search("database", 3)

	console.table(
		databaseResults.map((result) => ({
			id: result.document.id,
			content: result.document.content,
			score: result.score
		}))
	)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
