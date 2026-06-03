import {} from "../../bootstrap/dependencies.js"
import { EAgentAction } from "../../shared/enums/agent.enums.js"
import type { IAgentResponse } from "../../shared/interfaces/agent.interface.js"
import type { ILLMService } from "../../shared/interfaces/llm.interface.js"
import type { ReadFileTool } from "../../tools/read-file.tool.js"
import type { SearchTextTool } from "../../tools/search-text.tools.js"
import type { IChatMessage } from "../../types/chat.types.js"
import type { PromptBuilderService } from "../rag/prompt-builder.service.js"

export class AgentService {
	constructor(
		private readonly llmService: ILLMService,
		private readonly promptBuilderService: PromptBuilderService,
		private readonly searchTextTool: SearchTextTool,
		private readonly readFileTool: ReadFileTool
	) {}

	private async explainUsage(symbol: string): Promise<string> {
		const searchResult = await this.searchTextTool.execute({
			searchText: symbol
		})

		const files = searchResult.results.slice(0, 3)

		const contents = await Promise.all(
			files.map(async (file) => {
				const result = await this.readFileTool.execute({
					path: file.file
				})

				return {
					...result,
					content: result.content.slice(0, 3000)
				}
			})
		)

		const prompt = this.promptBuilderService.buildAnalysisPrompt(symbol, contents)

		const response = await this.llmService.generate({
			messages: [
				{
					role: "user",
					content: prompt
				}
			]
		})

		return response.content
	}

	async handle(message: string): Promise<IAgentResponse> {
		const decision = await this.llmService.decideAction(message)
		console.log("Agent handle decision:", decision)
		if (decision.action === EAgentAction.REPLACE_TEXT) {
			return {
				type: "tool",
				action: decision.action,
				args: decision.args
			}
		}

		if (decision.action === EAgentAction.LIST_FILES) {
			console.log("Agent decided to list files with pattern:", decision.args)
			return {
				type: "tool",
				action: decision.action,
				args: decision.args
			}
		}

		if (decision.action === EAgentAction.READ_FILE) {
			console.log("Agent decided to read file with targetPath:", decision.args)
			return {
				type: "tool",
				action: decision.action,
				args: decision.args
			}
		}

		if (decision.action === EAgentAction.SEARCH_TEXT) {
			console.log("Agent decided to search text with searchText:", decision.args)
			return {
				type: "tool",
				action: decision.action,
				args: decision.args
			}
		}

		if (decision.action === EAgentAction.EXPLAIN_USAGE) {
			const symbol = decision.args?.symbol
			console.log("Agent decided to explain usage for symbol:", symbol)
			if (typeof symbol !== "string") {
				return {
					type: "message",
					action: EAgentAction.CHAT
				}
			}

			const analysis = await this.explainUsage(symbol)
			console.log("Agent explain usage analysis:", analysis)
			return {
				type: "message",
				action: EAgentAction.CHAT,
				args: analysis
			}
		}

		return {
			type: "message",
			action: decision.action,
			args: decision.args
		}
	}
}
