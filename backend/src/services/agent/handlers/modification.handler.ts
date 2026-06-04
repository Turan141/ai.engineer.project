import { promptBuilderService } from "../../../bootstrap/dependencies.js"
import { EAgentAction } from "../../../shared/enums/agent.enums.js"
import type {
	IAgentContext,
	IAgentDecision,
	IAgentResponse
} from "../../../shared/interfaces/agent.interface.js"
import type {
	IListFilesResult,
	IReadFileResult,
	ISearchTextToolResult
} from "../../../shared/interfaces/ai-tools.interface.js"
import type {
	ICodePatch,
	IModifyArgs
} from "../../../shared/interfaces/planner.interface.js"
import type { LLMService } from "../../llm/llm.service.js"
import type { ToolRegistry } from "../../tools/tool-registry.service.js"
import type { PatchService } from "../patch.service.js"

const MAX_MODIFICATION_CONTEXT_CHARS = 30_000

export class ModifyHandler {
	constructor(
		private readonly toolRegistry: ToolRegistry,
		private readonly llmService: LLMService,
		private readonly patchService: PatchService
	) {}

	readonly action = EAgentAction.MODIFY

	private parseModificationArgs(args: IAgentDecision["args"]): IModifyArgs | null {
		if (!args || typeof args !== "object") {
			return null
		}

		const { target, task } = args ?? {}

		if (typeof target !== "string" || target.trim() === "") {
			return null
		}

		if (typeof task !== "string" || task.trim() === "") {
			return null
		}

		return {
			target: target.trim(),
			task: task.trim()
		}
	}

	async execute(
		params: IAgentDecision,
		context: IAgentContext
	): Promise<IAgentResponse> {
		const parsedArgs = this.parseModificationArgs(params?.args ?? {})

		if (!parsedArgs) {
			return {
				type: "chat",
				action: EAgentAction.CHAT,
				args: "Invalid arguments for modification. 'target' and 'task' are required."
			}
		}

		const filePath = await this.findTargetFile(parsedArgs.target)

		if (!filePath) {
			return {
				type: "assistant_message",
				action: EAgentAction.CHAT,
				content: `No files found matching "${parsedArgs.target}".`
			}
		}

		const readData = await this.toolRegistry.execute<IReadFileResult>({
			action: EAgentAction.READ_FILE,
			args: {
				path: filePath
			}
		})

		const prompt = promptBuilderService.buildModificationPrompt(
			parsedArgs.task,
			filePath,
			this.truncateContent(readData?.content ?? "")
		)

		const answer = await this.llmService.generate({
			messages: [
				{
					role: "user",
					content: prompt
				}
			]
		})

		const patch = await this.safelyParseJSON(answer.content, filePath)
		await this.patchService.savePendingPatch(context.sessionId, patch)

		return {
			type: "assistant_message",
			action: EAgentAction.CHAT,
			content: answer.content,
			metadata: {
				patch
			}
		}
	}

	private async safelyParseJSON(
		jsonString: string,
		filePath: string
	): Promise<ICodePatch> {
		try {
			const patch = this.parsePatchPayload(jsonString)
			if (patch) {
				return {
					filePath,
					summary: patch.summary,
					modifiedCode: patch.modifiedCode
				}
			} else {
				return {
					filePath,
					summary: "Failed to parse model response",
					modifiedCode: ""
				}
			}
		} catch (error) {
			return {
				filePath,
				summary: "Failed to parse model response",
				modifiedCode: ""
			}
		}
	}

	private parsePatchPayload(
		content: string
	): Pick<ICodePatch, "summary" | "modifiedCode"> | null {
		const jsonContent = this.extractJSONContent(content)
		const parsed = this.tryParseJSON(jsonContent)

		if (this.isPatchPayload(parsed)) {
			return parsed
		}

		if (
			parsed &&
			typeof parsed === "object" &&
			"text" in parsed &&
			typeof parsed.text === "string"
		) {
			return this.parsePatchPayload(parsed.text)
		}

		return null
	}

	private extractJSONContent(content: string): string {
		const trimmed = content.trim()
		const directJSON = this.extractJSONObject(trimmed)
		if (directJSON) {
			return directJSON
		}

		return trimmed
	}

	private extractJSONObject(content: string): string | null {
		const start = content.indexOf("{")
		if (start === -1) {
			return null
		}

		let depth = 0
		let inString = false
		let escaped = false

		for (let i = start; i < content.length; i += 1) {
			const char = content[i]

			if (escaped) {
				escaped = false
				continue
			}

			if (char === "\\") {
				escaped = true
				continue
			}

			if (char === '"') {
				inString = !inString
				continue
			}

			if (inString) {
				continue
			}

			if (char === "{") {
				depth += 1
			}

			if (char === "}") {
				depth -= 1
				if (depth === 0) {
					return content.slice(start, i + 1)
				}
			}
		}

		return null
	}

	private tryParseJSON(content: string): unknown | null {
		try {
			return JSON.parse(content)
		} catch (_error) {
			return null
		}
	}

	private isPatchPayload(
		value: unknown
	): value is Pick<ICodePatch, "summary" | "modifiedCode"> {
		return (
			!!value &&
			typeof value === "object" &&
			"summary" in value &&
			"modifiedCode" in value &&
			typeof value.summary === "string" &&
			typeof value.modifiedCode === "string"
		)
	}

	private truncateContent(content: string): string {
		if (content.length <= MAX_MODIFICATION_CONTEXT_CHARS) {
			return content
		}

		return `${content.slice(0, MAX_MODIFICATION_CONTEXT_CHARS)}

[Content truncated: ${content.length - MAX_MODIFICATION_CONTEXT_CHARS} characters omitted]`
	}

	private async findTargetFile(target: string): Promise<string | null> {
		const file = await this.toolRegistry.execute<IListFilesResult>({
			action: EAgentAction.LIST_FILES,
			args: {
				fileName: target
			}
		})

		if (file.files[0]) {
			return file.files[0]
		}

		const searchResult = await this.toolRegistry.execute<ISearchTextToolResult>({
			action: EAgentAction.SEARCH_TEXT,
			args: {
				searchText: target,
				maxResults: 10
			}
		})

		return searchResult.results[0]?.file ?? null
	}
}
