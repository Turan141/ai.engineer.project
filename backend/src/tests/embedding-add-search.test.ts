import "dotenv/config"
import { embeddingProvider, sqliteVectorRepository } from "../bootstrap/dependencies.js"

async function main(): Promise<void> {
	await sqliteVectorRepository.addDocument({
		id: "1",
		content: "React is a frontend library",
		source: "doc1",
		embedding: await embeddingProvider.generateEmbedding("React is a frontend library"),
		metadata: {
			chunkIndex: 0,
			title: "doc3"
		}
	})

	await sqliteVectorRepository.addDocument({
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

	await sqliteVectorRepository.addDocument({
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

	await sqliteVectorRepository.addDocument({
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

	const soccerResults = await sqliteVectorRepository.search("soccer", 3)

	console.table(
		soccerResults.map(
			(result: { document: { id: string; content: string }; score: number }) => ({
				id: result.document.id,
				content: result.document.content,
				score: result.score
			})
		)
	)

	console.log("\n=== QUERY: frontend framework ===")

	const frontendResults = await sqliteVectorRepository.search("frontend framework", 3)

	console.table(
		frontendResults.map(
			(result: { document: { id: string; content: string }; score: number }) => ({
				id: result.document.id,
				content: result.document.content,
				score: result.score
			})
		)
	)

	console.log("\n=== QUERY: database ===")

	const databaseResults = await sqliteVectorRepository.search("database", 3)

	console.table(
		databaseResults.map(
			(result: { document: { id: string; content: string }; score: number }) => ({
				id: result.document.id,
				content: result.document.content,
				score: result.score
			})
		)
	)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
