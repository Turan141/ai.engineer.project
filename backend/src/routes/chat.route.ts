import { Router } from "express"
import type { IChatMessage } from "../types/chat.types.js"
import type { IAgentDecision } from "../shared/interfaces/agent.interface.js"
import {
	agentService,
	fileSystemService,
	llmService,
	memoryService,
	patchService,
	promptBuilderService,
	ragService,
	toolRegistry
} from "../bootstrap/dependencies.js"
import type { ICodePatch } from "../shared/interfaces/planner.interface.js"

export const chatRouter = Router()

const SYSTEM_MESSAGE: IChatMessage = {
	role: "system",
	content: promptBuilderService.buildSystemPrompt()
}

function isCodePatch(value: unknown): value is ICodePatch {
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

function summarizeToolResultForMemory(result: unknown): string {
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

function summarizeAgentResponseForMemory(content: string, metadata?: Record<string, unknown>): string {
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

function withSystemPrompt(messages: IChatMessage[]): IChatMessage[] {
	return [SYSTEM_MESSAGE, ...messages]
}

chatRouter.get("/chat/history/:sessionId", async (req, res) => {
	const { sessionId } = req.params
	if (typeof sessionId !== "string" || sessionId.trim() === "") {
		return res.status(400).json({ error: "Session ID is required" })
	}

	const history = await memoryService.getConversationContext(sessionId)
	return res.json({ history })
})

chatRouter.post("/embeddings", async (req, res) => {
	const { text } = req.body

	const abortController = new AbortController()
	req.on("close", () => {
		abortController.abort()
	})

	if (typeof text !== "string" || text.trim() === "") {
		return res.status(400).json({ error: "Text is required for embedding generation" })
	}

	try {
		const embedding = await llmService.generateEmbedding(text, abortController.signal)
		return res.json({ embedding })
	} catch (error) {
		if ((error as any)?.name === "AbortError") {
			// Client disconnected — no need to write anything
			return
		}
		console.error("Error generating embedding:", error)
		return res.status(500).json({ error: "Failed to generate embedding" })
	}
})

chatRouter.delete("/chat/messages/:sessionId", async (req, res) => {
	const { sessionId } = req.params
	if (typeof sessionId !== "string" || sessionId.trim() === "") {
		return res.status(400).json({ error: "Session ID is required" })
	}
	try {
		await memoryService.clearConversationContext(sessionId)
		return res.json({ success: true, message: "Conversation context cleared" })
	} catch (error) {
		console.error("Error clearing conversation context:", error)
		return res.status(500).json({ error: "Failed to clear conversation context" })
	}
})

chatRouter.get("/debug/messages/:sessionId", async (req, res) => {
	const { sessionId } = req.params
	if (typeof sessionId !== "string" || sessionId.trim() === "") {
		return res.status(400).json({ error: "Session ID is required" })
	}
	try {
		const messages = await memoryService.getConversationContext(sessionId)
		console.log(messages)
		return res.json({ messages })
	} catch (error) {
		console.error("Error fetching messages for session:", error)
		return res.status(500).json({ error: "Failed to fetch messages" })
	}
})

chatRouter.post("/chat/stream", async (req, res) => {
	const origin = req.headers.origin ?? ""
	if (
		origin === "https://ai-support-leather.vercel.app" ||
		origin.startsWith("http://localhost") ||
		origin.startsWith("http://127.0.0.1")
	) {
		res.setHeader("Access-Control-Allow-Origin", origin)
		res.setHeader("Access-Control-Allow-Private-Network", "true")
		res.setHeader("Vary", "Origin, Access-Control-Request-Private-Network")
	}

	res.setHeader("Content-Type", "text/event-stream")
	res.setHeader("Cache-Control", "no-cache, no-transform")
	res.setHeader("Connection", "keep-alive")
	res.setHeader("X-Accel-Buffering", "no")
	req.socket?.setNoDelay(true)
	res.flushHeaders()

	const abortController = new AbortController()

	res.on("close", () => {
		abortController.abort()
	})

	try {
		const { sessionId, message, mode = "agent", applyPatch, patch } = req.body
		if (typeof sessionId !== "string" || sessionId.trim() === "") {
			res.write(`data: ${JSON.stringify({ error: "Session ID is required" })}\n\n`)
			res.end()
			return
		}

		if (mode === "agent" && applyPatch === true) {
			const directPatch = isCodePatch(patch)
				? patch
				: await patchService.getPendingPatch(sessionId)

			if (!directPatch) {
				res.write(
					`data: ${JSON.stringify({
						text: "No pending patch found for this session."
					})}\n\n`
				)
				res.write("data: [DONE]\n\n")
				res.end()
				await memoryService.addMessage(sessionId, message, "user")
				await memoryService.addMessage(
					sessionId,
					"No pending patch found for this session.",
					"assistant"
				)
				return
			}

			await fileSystemService.writeFile(
				directPatch.filePath,
				directPatch.modifiedCode
			)
			await patchService.clearPendingPatch(sessionId)

			const content = `Patch applied: ${directPatch.summary}`
			const metadata = {
				file: directPatch.filePath
			}

			res.write(
				`data: ${JSON.stringify({
					text: content,
					metadata
				})}\n\n`
			)
			res.write("data: [DONE]\n\n")
			res.end()
			await memoryService.addMessage(sessionId, message, "user")
			await memoryService.addMessage(
				sessionId,
				summarizeAgentResponseForMemory(content, metadata),
				"assistant"
			)
			return
		}

		if (mode === "agent") {
			const resp = await agentService.handle(message, {
				sessionId
			})

			if (resp.type === "tool") {
				const result = await toolRegistry.execute(resp as IAgentDecision)
				res.write(
					`data: ${JSON.stringify({
						type: "tool_result",
						result
					})}\n\n`
				)

				res.write("data: [DONE]\n\n")
				res.end()
				await memoryService.addMessage(sessionId, message, "user")
				await memoryService.addMessage(
					sessionId,
					summarizeToolResultForMemory(result),
					"assistant"
				)

				return
			}

			if (resp.type === "assistant_message") {
				res.write(
					`data: ${JSON.stringify({
						text: resp.content,
						metadata: resp.metadata
					})}\n\n`
				)
				res.write("data: [DONE]\n\n")
				res.end()
				await memoryService.addMessage(sessionId, message, "user")
				await memoryService.addMessage(
					sessionId,
					summarizeAgentResponseForMemory(resp.content, resp.metadata),
					"assistant"
				)

				return
			}
		}

		await memoryService.addMessage(sessionId, message, "user")
		const messages = await memoryService.getConversationContext(sessionId)
		const stream = ragService.askStream(
			withSystemPrompt(messages),
			abortController.signal
		)

		let assistantResponse = ""

		for await (const chunk of stream) {
			if (abortController.signal.aborted) {
				console.log("Request aborted by the client")
				break
			}
			assistantResponse += chunk.text
			res.write(`data: ${JSON.stringify(chunk)}\n\n`)
		}
		await memoryService.addMessage(sessionId, assistantResponse, "assistant")
		res.write("data: [DONE]\n\n")
		res.end()
	} catch (error) {
		if ((error as any)?.name === "AbortError") {
			// Client disconnected — no need to write anything
			res.end()
			return
		}
		console.error("Error generating AI response stream:", error)
		try {
			res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`)
		} catch (e) {
			// ignore write errors
		}
		res.end()
		return
	}
})
