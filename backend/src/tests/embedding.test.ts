import "dotenv/config"
import { cosineSimilarity } from "../shared/utils/cosine-similarity.js"
import { embeddingProvider } from "../bootstrap/dependencies.js"

async function testEmbeddings(): Promise<void> {
	const football = await embeddingProvider.generateEmbedding("football")
	const soccer = await embeddingProvider.generateEmbedding("soccer")
	const database = await embeddingProvider.generateEmbedding("database")
	const basketball = await embeddingProvider.generateEmbedding("basketball")
	const react = await embeddingProvider.generateEmbedding("react")
	const javascript = await embeddingProvider.generateEmbedding("javascript")

	console.log("football-soccer:", cosineSimilarity(football, soccer))
	console.log("football-database:", cosineSimilarity(football, database))
	console.log("football-basketball", cosineSimilarity(football, basketball))
	console.log("football-react", cosineSimilarity(football, react))
	console.log("react-javascript", cosineSimilarity(react, javascript))
}

testEmbeddings().catch((error) => {
	console.error("Test failed:", error)
	process.exit(1)
})
