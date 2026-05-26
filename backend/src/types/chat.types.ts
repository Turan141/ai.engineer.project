// Barrel — re-exports from shared/ for backward compatibility.
// Import directly from shared/ in new code.

export type { TChatMessageRole } from "../shared/types/chat.types.js"

export type { IInitializable } from "../shared/interfaces/common.interface.js"

export type {
	IChatMessage,
	IGenerateParams,
	ILLMProvider,
	ILMStudioMessage,
	ILMStudioChoice,
	ILMStudioResponse,
	ILMStudioDelta,
	ILMStudioStreamChoice,
	ILMStudioStreamResponse
} from "../shared/interfaces/llm.interface.js"

export type { IEmbeddingProvider, IEmbeddingResponse } from "../shared/interfaces/embedding.interface.js"

export type {
	IVectorDocument,
	ISearchResult,
	IRAGResponse,
	IVectorStore
} from "../shared/interfaces/vector-store.interface.js"

export type { IRetrievalStrategy } from "../shared/interfaces/retrieval.interface.js"

