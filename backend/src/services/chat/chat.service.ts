import type { IAgentDecision } from "../../shared/interfaces/agent.interface.js"
import type { ICodePatch } from "../../shared/interfaces/planner.interface.js"
import type { ILLMService } from "../../shared/interfaces/llm.interface.js"
import type { IChatMessage } from "../../types/chat.types.js"
import type { AgentService } from "../agent/agent.service.js"
import type { PatchService } from "../agent/patch.service.js"
import type { MemoryService } from "../memory/memory.service.js"
import type { PromptBuilderService } from "../rag/prompt-builder.service.js"
import type { RAGService } from "../rag/rag.service.js"
import type { ToolRegistry } from "../tools/tool-registry.service.js"
import type { FileSystemService } from "../tools/file-system/file-system.service.js"

interface IChatStreamRequest {
	sessionId?: unknown
	message?: unknown
	mode?: unknown
	applyPatch?: unknown
	patch?: unknown
}

interface IChatStreamWriter {
	write(data: string): void
	end(): void
}

export class ChatService {
	constructor(
		private readonly agentService: AgentService,
		private readonly fileSystemService: FileSystemService,
		private readonly llmService: ILLMService,
		private readonly memoryService: MemoryService,
		private readonly patchService: PatchService,
		private readonly promptBuilderService: PromptBuilderService,
		private readonly ragService: RAGService,
		private readonly toolRegistry: ToolRegistry
	) {}

	async getHistory(sessionId: string): Promise<IChatMessage[]> {
		return this.memoryService.getConversationContext(sessionId)
	}

	async getDebugMessages(sessionId: string): Promise<IChatMessage[]> {
		return this.memoryService.getConversationContext(sessionId)
	}

	async clearHistory(sessionId: string): Promise<void> {
		await this.memoryService.clearConversationContext(sessionId)
	}

	async generateEmbedding(text: string, signal?: AbortSignal): Promise<number[]> {
		return this.llmService.generateEmbedding(text, signal)
	}

	async handleStream(
		body: IChatStreamRequest,
		writer: IChatStreamWriter,
		signal: AbortSignal
	): Promise<void> {
		const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : ""
		if (!sessionId) {
			this.writeEvent(writer, { error: "Session ID is required" })
			writer.end()
			return
		}

		const message = typeof body.message === "string" ? body.message : ""
		const mode = body.mode === "chat" ? "chat" : "agent"

		if (mode === "agent" && body.applyPatch === true) {
			await this.handleApplyPatch(sessionId, message, body.patch, writer)
			return
		}

		if (mode === "agent") {
			const handled = await this.handleAgentMessage(sessionId, message, writer)
			if (handled) {
				return
			}
		}

		await this.handleRagMessage(sessionId, message, writer, signal)
	}

	private async handleApplyPatch(
		sessionId: string,
		message: string,
		patchPayload: unknown,
		writer: IChatStreamWriter
	): Promise<void> {
		const patch = this.isCodePatch(patchPayload)
			? patchPayload
			: await this.patchService.getPendingPatch(sessionId)

		if (!patch) {
			const content = "No pending patch found for this session."
			this.writeText(writer, content)
			await this.rememberExchange(sessionId, message, content)
			return
		}

		await this.fileSystemService.writeFile(patch.filePath, patch.modifiedCode)
		await this.patchService.clearPendingPatch(sessionId)

		const content = `Patch applied: ${patch.summary}`
		const metadata = { file: patch.filePath }
		this.writeText(writer, content, metadata)
		await this.rememberExchange(
			sessionId,
			message,
			this.summarizeAgentResponseForMemory(content, metadata)
		)
	}

	private async handleAgentMessage(
		sessionId: string,
		message: string,
		writer: IChatStreamWriter
	): Promise<boolean> {
		const response = await this.agentService.handle(message, { sessionId })

		if (response.type === "tool") {
			const result = await this.toolRegistry.execute(response as IAgentDecision)
			this.writeEvent(writer, {
				type: "tool_result",
				result
			})
			this.writeDone(writer)
			await this.rememberExchange(
				sessionId,
				message,
				this.summarizeToolResultForMemory(result)
			)
			return true
		}

		if (response.type === "assistant_message") {
			this.writeText(writer, response.content, response.metadata)
			await this.rememberExchange(
				sessionId,
				message,
				this.summarizeAgentResponseForMemory(response.content, response.metadata)
			)
			return true
		}

		return false
	}

	private async handleRagMessage(
		sessionId: string,
		message: string,
		writer: IChatStreamWriter,
		signal: AbortSignal
	): Promise<void> {
		await this.memoryService.addMessage(sessionId, message, "user")

		const messages = await this.memoryService.getConversationContext(sessionId)
		const stream = this.ragService.askStream(
			this.withSystemPrompt(messages),
			signal
		)

		let assistantResponse = ""

		for await (const chunk of stream) {
			if (signal.aborted) {
				break
			}
			assistantResponse += chunk.text
			this.writeEvent(writer, chunk)
		}

		await this.memoryService.addMessage(sessionId, assistantResponse, "assistant")
		this.writeDone(writer)
	}

	private async rememberExchange(
		sessionId: string,
		userMessage: string,
		assistantMessage: string
	): Promise<void> {
		await this.memoryService.addMessage(sessionId, userMessage, "user")
		await this.memoryService.addMessage(sessionId, assistantMessage, "assistant")
	}

	private withSystemPrompt(messages: IChatMessage[]): IChatMessage[] {
		return [
			{
				role: "system",
				content: this.promptBuilderService.buildSystemPrompt()
			},
			...messages
		]
	}

	private writeText(
		writer: IChatStreamWriter,
		text: string,
		metadata?: Record<string, unknown>
	): void {
		this.writeEvent(writer, {
			text,
			...(metadata ? { metadata } : {})
		})
		this.writeDone(writer)
	}

	private writeDone(writer: IChatStreamWriter): void {
		writer.write("data: [DONE]\n\n")
		writer.end()
	}

	private writeEvent(writer: IChatStreamWriter, payload: unknown): void {
		writer.write(`data: ${JSON.stringify(payload)}\n\n`)
	}

	private isCodePatch(value: unknown): value is ICodePatch {
		return (
			!!value &&
			typeof value === "object" &&
			"filePath" in value &&
			"summary" in value &&
			"modifiedCode" in value &&
			typeof value.filePath === "string" &&
			value.filePath.trim() !== "" &&
			typeof value.summary === "string" &&
			typeof value.modifiedCode === "string" &&
			value.modifiedCode.trim() !== ""
		)
	}

	private summarizeToolResultForMemory(result: unknown): string {
		if (
			result &&
			typeof result === "object" &&
			"content" in result &&
			typeof (result as { content?: unknown }).content === "string"
		) {
			const readFileResult = result as { path?: unknown; content: string }

			return JSON.stringify({
				type: "tool_result_summary",
				path: readFileResult.path,
				contentLength: readFileResult.content.length,
				preview: readFileResult.content.slice(0, 1000)
			})
		}

		if (
			result &&
			typeof result === "object" &&
			"results" in result &&
			Array.isArray((result as { results?: unknown }).results)
		) {
			const searchResult = result as {
				results: Array<{ file?: unknown; matches?: unknown }>
				count?: unknown
				truncated?: unknown
				maxResults?: unknown
			}
			const preview = searchResult.results.slice(0, 10).map((item) => ({
				file: item.file,
				matches: item.matches
			}))

			return JSON.stringify({
				type: "tool_result_summary",
				count: searchResult.count,
				truncated: searchResult.truncated,
				maxResults: searchResult.maxResults,
				preview
			})
		}

		return JSON.stringify(result)
	}

	private summarizeAgentResponseForMemory(
		content: string,
		metadata?: Record<string, unknown>
	): string {
		const patch = metadata?.patch

		if (
			patch &&
			typeof patch === "object" &&
			"summary" in patch &&
			"filePath" in patch &&
			"modifiedCode" in patch &&
			typeof patch.summary === "string" &&
			typeof patch.filePath === "string" &&
			typeof patch.modifiedCode === "string" &&
			patch.summary !== "Failed to parse model response" &&
			patch.modifiedCode.trim() !== ""
		) {
			return JSON.stringify({
				type: "agent_patch_summary",
				file: patch.filePath,
				summary: patch.summary
			})
		}

		const trimmedContent = content.trim()

		try {
			const parsed: unknown = JSON.parse(trimmedContent)
			if (
				parsed &&
				typeof parsed === "object" &&
				"summary" in parsed &&
				"modifiedCode" in parsed &&
				typeof parsed.summary === "string" &&
				typeof parsed.modifiedCode === "string" &&
				parsed.summary !== "Failed to parse model response" &&
				parsed.modifiedCode.trim() !== ""
			) {
				return JSON.stringify({
					type: "agent_patch_summary",
					summary: parsed.summary
				})
			}
		} catch (_error) {
			// Non-JSON assistant messages are stored as a bounded text preview below.
		}

		return content.length > 2000
			? `${content.slice(0, 2000)}

[Assistant response truncated for memory: ${content.length - 2000} characters omitted]`
			: content
	}
}
