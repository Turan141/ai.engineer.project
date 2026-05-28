import { config } from "../config/config.js"
import { FileSystemDocumentLoader } from "../knowledge/loaders/document-loader.js"
import { KnowledgeBase } from "../knowledge/documents/knowledge-base.js"
import { RecursiveTextSplitter } from "../knowledge/splitters/recursitve-text-splitter.js"
import { MemoryService } from "../services/memory/memory.service.js"
import { SummaryService } from "../services/memory/summary.service.js"
import { LMStudioEmbeddingService } from "../providers/embedding/lmstudio.embedding.provider.js"
import { ImageService } from "../services/image/image.service.js"
import { LLMService } from "../services/llm/llm.service.js"
import { PromptBuilderService } from "../services/rag/prompt-builder.service.js"
import { RAGService } from "../services/rag/rag.service.js"
import { ThresholdRetrievalFilter } from "../services/rag/retrieval/treshold_retrieval_filter.service.js"
import { InMemoryVectorStore } from "../storage/vector-store/vector.store.service.js"
import { ImagePresetService } from "../services/image/iamge-preset.service.js"
import { ComfyUIProvider } from "../providers/image/comfyui.provider.js"
import { ImageMemory } from "../storage/repositories/image.repository.js"
import { SQLiteService } from "../storage/sqlite/sqlite.service.js"
import { SQLiteMessageRepository } from "../storage/sqlite/sqlite-message.repository.js"
import { SQLiteSummaryRepository } from "../storage/sqlite/sqlite-summary.repository.js"

export const sqLiteService = new SQLiteService()
export const comfyProvider = new ComfyUIProvider()
export const presetService = new ImagePresetService()
export const imageMemory = new ImageMemory()
export const imageService = new ImageService(comfyProvider, imageMemory)
export const promptBuilderService = new PromptBuilderService()
export const llmService = new LLMService()
export const messagesRepository = new SQLiteMessageRepository(sqLiteService)
export const summaryService = new SummaryService(llmService)
export const summaryRepository = new SQLiteSummaryRepository(sqLiteService)
export const memoryService = new MemoryService(
	summaryService,
	messagesRepository,
	summaryRepository
)
export const embeddingProvider = new LMStudioEmbeddingService()
export const vectorStore = new InMemoryVectorStore(embeddingProvider)
export const loader = new FileSystemDocumentLoader()
export const splitter = new RecursiveTextSplitter()
export const knowledgeBase = new KnowledgeBase(loader, splitter, vectorStore)
export const retrievalFilter = new ThresholdRetrievalFilter(config.rag.treshold)
export const ragService = new RAGService(vectorStore, llmService, retrievalFilter)
