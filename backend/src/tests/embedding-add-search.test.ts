import "dotenv/config"
import { InMemoryVectorStore } from "../services/vector.store.service.js"
import { LMStudioEmbeddingService } from "../services/lmstudio.embedding.service.js"

async function main(): Promise<void> {
	const embeddingProvider = new LMStudioEmbeddingService()

	const store = new InMemoryVectorStore(embeddingProvider)

	await store.addDocument({
		index: 1,
		text: "React is a frontend library"
	})

	await store.addDocument({
		index: 2,
		text: "PostgreSQL is a relational database"
	})

	await store.addDocument({
		index: 3,
		text: "Football is the most popular sport in the world"
	})

	await store.addDocument({
		index: 4,
		text: "Basketball is played with five players per team"
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
