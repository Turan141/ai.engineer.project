import { config } from "../config/config.js"
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
import { ImagePresetService } from "../services/image/iamge-preset.service.js"
import { ComfyUIProvider } from "../providers/image/comfyui.provider.js"
import { ImageMemory } from "../storage/repositories/image.repository.js"
import { SQLiteService } from "../storage/sqlite/sqlite.service.js"
import { SQLiteMessageRepository } from "../storage/sqlite/sqlite-message.repository.js"
import { SQLiteSummaryRepository } from "../storage/sqlite/sqlite-summary.repository.js"
import { DocumentService } from "../services/document/document.service.js"
import { DocumentAnalysisService } from "../services/document/document-analysis.service.js"
import { DocumentOCRService } from "../services/document/document-ocr.service.js"
import { SQLiteVectorRepository } from "../storage/sqlite/sq-lite-vectors.repository.js"
import { FileSystemDocumentLoader } from "../knowledge/documents/document-loader.js"
import { SQLiteDocumentRepository } from "../storage/sqlite/sqlite-document.repository.js"
import { SQLiteKeywordRepository } from "../storage/sqlite/sq-lite-keyword.repository.js"
import { HybridSearchService } from "../services/rag/retrieval/hybrid-search.service.js"

// Providers
export const comfyProvider = new ComfyUIProvider()
export const embeddingProvider = new LMStudioEmbeddingService()

// SQLite
export const sqLiteService = new SQLiteService()

// Repositories
export const summaryRepository = new SQLiteSummaryRepository(sqLiteService)
export const documentRepository = new SQLiteDocumentRepository(sqLiteService)
export const messagesRepository = new SQLiteMessageRepository(sqLiteService)
export const sqliteKeywordRepository = new SQLiteKeywordRepository(sqLiteService)
export const sqliteVectorRepository = new SQLiteVectorRepository(
	sqLiteService,
	embeddingProvider
)

// Memory
export const imageMemory = new ImageMemory()

// Filters
export const retrievalFilter = new ThresholdRetrievalFilter(config.rag.treshold)

// Knowledge
export const loader = new FileSystemDocumentLoader()
export const splitter = new RecursiveTextSplitter()
export const knowledgeBase = new KnowledgeBase(loader, splitter, sqliteVectorRepository)

// Services
export const llmService = new LLMService()
export const presetService = new ImagePresetService()
export const documentAnalysisService = new DocumentAnalysisService(llmService)
export const imageService = new ImageService(comfyProvider, imageMemory)
export const documentOcrService = new DocumentOCRService()
export const promptBuilderService = new PromptBuilderService()
export const summaryService = new SummaryService(llmService)
export const hybridService = new HybridSearchService(
	sqliteVectorRepository,
	sqliteKeywordRepository
)
export const ragService = new RAGService(hybridService, llmService, retrievalFilter)
export const documentService = new DocumentService(
	documentAnalysisService,
	documentOcrService,
	documentRepository
)
export const memoryService = new MemoryService(
	summaryService,
	messagesRepository,
	summaryRepository
)
