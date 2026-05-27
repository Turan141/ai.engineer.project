import { config } from "../config/config.js"
import { FileSystemDocumentLoader } from "../knowledge/loaders/document-loader.js"
import { KnowledgeBase } from "../knowledge/documents/knowledge-base.js"
import { RecursiveTextSplitter } from "../knowledge/splitters/recursitve-text-splitter.js"
import { InMemoryConversationMemory } from "../storage/memory/in-memory-conversation-memory.js"
import { InMemorySummaryMemory } from "../storage/memory/in-memory-summary-memory.js"
import { MemoryService } from "../services/memory/memory.service.js"
import { SummaryService } from "../services/memory/summary.service.js"
import { LMStudioEmbeddingService } from "../providers/embedding/lmstudio.embedding.provider.js"
import { ImageService } from "../services/image/image.service.js"
import { LLMService } from "../services/llm/llm.service.js"
import { PromptBuilderService } from "../services/rag/prompt-builder.service.js"
import { RAGService } from "../services/rag/rag.service.js"
import { ThresholdRetrievalFilter } from "../services/rag/retrieval/treshold_retrieval_filter.service.js"
import { InMemoryVectorStore } from "../storage/vector-store/vector.store.service.js"
import { InMemoryImageStore } from "../storage/memory/in-memory-image-memory.js"
import { ImagePresetService } from "../services/image/iamge-preset.service.js"
import { ComfyUIProvider } from "../providers/image/comfyui.provider.js"

export const comfyProvider = new ComfyUIProvider()
export const presetService = new ImagePresetService()
export const imageMemory = new InMemoryImageStore()
export const imageService = new ImageService(comfyProvider, imageMemory)
export const promptBuilderService = new PromptBuilderService()
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
