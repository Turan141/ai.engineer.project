import { config } from "../config/config.js"
import { FileSystemDocumentLoader } from "../knowledge/document-loader.js"
import { KnowledgeBase } from "../knowledge/knowledge-base.js"
import { RecursiveTextSplitter } from "../knowledge/recursitve-text-splitter.js"
import { InMemoryConversationMemory } from "../memory/in-memory-conversation-memory.js"
import { InMemorySummaryMemory } from "../memory/in-memory-summary-memory.js"
import { MemoryService } from "../memory/memory.service.js"
import { SummaryService } from "../memory/summary.service.js"
import { LMStudioEmbeddingService } from "../services/ai_services/lmstudio.embedding.service.js"
import { LLMService } from "../services/llm.service.js"
import { RAGService } from "../services/rag.service.js"
import { ThresholdRetrievalFilter } from "../services/retrieval_filters/treshold_retrieval_filter.service.js"
import { InMemoryVectorStore } from "../services/vector.store.service.js"

export const llmService = new LLMService()
export const conversationMemory = new InMemoryConversationMemory()
export const summaryService = new SummaryService(llmService)
export const summaryMemory = new InMemorySummaryMemory()
export const memoryService = new MemoryService(
	conversationMemory,
	summaryMemory,
	summaryService
)
export const embeddingProvider = new LMStudioEmbeddingService()
export const vectorStore = new InMemoryVectorStore(embeddingProvider)
export const loader = new FileSystemDocumentLoader()
export const splitter = new RecursiveTextSplitter()
export const knowledgeBase = new KnowledgeBase(loader, splitter, vectorStore)
export const retrievalFilter = new ThresholdRetrievalFilter(config.rag.treshold)
export const ragService = new RAGService(vectorStore, llmService, retrievalFilter)
