const geminiApiKey = process.env.GEMINI_API_KEY
const llmProvider = process.env.LLM_PROVIDER

if (llmProvider === "gemini" && !geminiApiKey) {
	throw new Error("GEMINI_API_KEY is not defined in environment variables")
}

if (!llmProvider) {
	throw new Error("LLM_PROVIDER is not defined in environment variables")
}

if (!process.env.LMSTUDIO_BASE_URL) {
	throw new Error("LMSTUDIO_BASE_URL is not defined in environment variables")
}

if (!process.env.LLM_MODEL) {
	throw new Error("LLM_MODEL is not defined in environment variables")
}

export const config = {
	geminiApiKey: geminiApiKey,
	llmProvider: llmProvider,
	defaultProvider: llmProvider,
	lmstudioBaseUrl: process.env.LMSTUDIO_BASE_URL || "http://localhost:1234",
	llmModel: process.env.LLM_MODEL,
	embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
	rag: {
		treshold: parseFloat(process.env.RAG_TRESHOLD || "0.5")
	}
}
