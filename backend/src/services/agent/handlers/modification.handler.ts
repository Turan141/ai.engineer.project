import { promptBuilderService } from "../../../bootstrap/dependencies.js"
import { EAgentAction } from "../../../shared/enums/agent.enums.js"
import type {
	IAgentDecision,
	IAgentResponse
} from "../../../shared/interfaces/agent.interface.js"
import type {
	IListFilesResult,
	IReadFileResult
} from "../../../shared/interfaces/ai-tools.interface.js"
import type { IModifyArgs } from "../../../shared/interfaces/planner.interface.js"
import type { LLMService } from "../../llm/llm.service.js"
import type { ToolRegistry } from "../../tools/tool-registry.service.js"

export class ModifyHandler {
	constructor(
		private readonly toolRegistry: ToolRegistry,
		private readonly llmService: LLMService
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

		const file = await this.toolRegistry.execute<IListFilesResult>({
			action: EAgentAction.LIST_FILES,
			args: {
				fileName: parsedArgs.target
			}
		})

		if (file.files.length === 0 || !file.files[0]) {
			return {
				type: "assistant_message",
				action: EAgentAction.CHAT,
				content: `No files found matching "${parsedArgs.target}".`
			}
		}

		const readData = await this.toolRegistry.execute<IReadFileResult>({
			action: EAgentAction.READ_FILE,
			args: {
				path: file.files[0]
			}
		})

		const prompt = promptBuilderService.buildModificationPrompt(
			parsedArgs.task,
			file.files[0],
			readData?.content
		)

		const answer = await this.llmService.generate({
			messages: [
				{
					role: "user",
					content: prompt
				}
			]
		})
		return {
			type: "assistant_message",
			action: EAgentAction.CHAT,
			content: answer.content
		}
	}
}
