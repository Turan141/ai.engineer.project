import { inMemoryVectorStore } from "../services/llm/llm.service.js"

export async function seedDocuments(): Promise<void> {
	await inMemoryVectorStore.addDocument({
		index: 1,
		text: "Aegis is an AI platform for learning and building production AI systems."
	})

	await inMemoryVectorStore.addDocument({
		index: 2,
		text: "Aegis uses LM Studio as a local large language model provider."
	})

	await inMemoryVectorStore.addDocument({
		index: 3,
		text: "Aegis supports Retrieval Augmented Generation also known as RAG."
	})

	await inMemoryVectorStore.addDocument({
		index: 4,
		text: "Aegis stores document embeddings in an in-memory vector store."
	})

	await inMemoryVectorStore.addDocument({
		index: 5,
		text: "Embeddings are generated using the nomic embedding model running in LM Studio."
	})

	await inMemoryVectorStore.addDocument({
		index: 6,
		text: "Semantic search in Aegis uses cosine similarity between embedding vectors."
	})

	await inMemoryVectorStore.addDocument({
		index: 7,
		text: "The backend of Aegis is built with Express and TypeScript."
	})

	await inMemoryVectorStore.addDocument({
		index: 8,
		text: "Aegis streams responses from language models using Server Sent Events."
	})

	await inMemoryVectorStore.addDocument({
		index: 9,
		text: "The goal of Aegis is to help developers become AI Engineers through practice."
	})

	await inMemoryVectorStore.addDocument({
		index: 10,
		text: "Aegis uses provider abstractions so that language models can be replaced without changing business logic."
	})
}
