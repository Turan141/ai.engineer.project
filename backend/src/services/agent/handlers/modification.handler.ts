import { promptBuilderService } from "../../../bootstrap/dependencies.js"
import { EAgentAction } from "../../../shared/enums/agent.enums.js"
import type {
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
import type { PatchService } from "../apply-patch.service.js"

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

	async execute(params: IAgentDecision): Promise<IAgentResponse> {
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

		const taskType = parsedArgs.task.toLowerCase().includes("refactor")
			? "refactor"
			: parsedArgs.task.toLowerCase().includes("fix")
				? "bugfix"
				: "modify"

		const prompt = promptBuilderService.buildModificationPrompt(
			taskType,
			filePath,
			readData?.content
		)

		await this.patchService.applyPatch(filePath, {
			summary: `Modification task: ${parsedArgs.task}`,
			modifiedCode: readData?.content ?? ""
		})

		// apply

		// get

		const answer = await this.llmService.generate({
			messages: [
				{
					role: "user",
					content: prompt
				}
			]
		})

		const patch = await this.safelyParseJSON(answer.content)

		return {
			type: "assistant_message",
			action: EAgentAction.CHAT,
			content: answer.content,
			metadata: {
				patch
			}
		}
	}

	private async safelyParseJSON(jsonString: string): Promise<ICodePatch | null> {
		try {
			let content = jsonString.trim()
			if (content.startsWith("```json")) {
				content = content
					.replace(/^```json\s*/i, "")
					.replace(/```$/i, "")
					.trim()
			}

			if (content.startsWith("```")) {
				content = content
					.replace(/^```\s*/i, "")
					.replace(/```$/i, "")
					.trim()
			}

			const patch = JSON.parse(content)
			if (typeof patch === "object") {
				return patch
			} else {
				return {
					summary: "Failed to parse model response",
					modifiedCode: ""
				}
			}
		} catch (error) {
			return {
				summary: "Failed to parse model response",
				modifiedCode: ""
			}
		}
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
