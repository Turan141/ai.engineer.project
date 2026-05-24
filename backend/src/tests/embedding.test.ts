import "dotenv/config"
import { LMStudioEmbeddingService } from "../services/lmstudio.embedding.service.js"
import { cosineSimilarity } from "../utils/cosine-similarity.js"

async function testEmbeddings(): Promise<void> {
	const embeddingService = new LMStudioEmbeddingService()

	const football = await embeddingService.generateEmbedding("football")
	const soccer = await embeddingService.generateEmbedding("soccer")
	const database = await embeddingService.generateEmbedding("database")
	const basketball = await embeddingService.generateEmbedding("basketball")
	const react = await embeddingService.generateEmbedding("react")
	const javascript = await embeddingService.generateEmbedding("javascript")

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
