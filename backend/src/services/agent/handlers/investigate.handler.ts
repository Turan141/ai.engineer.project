import { EAgentAction } from "../../../shared/enums/agent.enums.js"
import type {
	IAgentDecision,
	IAgentHandler,
	IAgentResponse
} from "../../../shared/interfaces/agent.interface.js"
import type { IInvestigateArgs } from "../../../shared/interfaces/planner.interface.js"
import type { ReadFileTool } from "../../../tools/read-file.tool.js"
import type { SearchTextTool } from "../../../tools/search-text.tools.js"
import type { ILLMService } from "../../../shared/interfaces/llm.interface.js"
import type { PromptBuilderService } from "../../rag/prompt-builder.service.js"

export class InvestigateHandler implements IAgentHandler {
	readonly action = EAgentAction.INVESTIGATE

	constructor(
		private readonly searchTextTool: SearchTextTool,
		private readonly readFileTool: ReadFileTool,
		private readonly llmService: ILLMService,
		private readonly promptBuilder: PromptBuilderService
	) {}

	async execute(decision: IAgentDecision): Promise<IAgentResponse> {
		const args = this.parseArgs(decision.args)

		if (!args) {
			return {
				type: "chat",
				action: EAgentAction.CHAT
			}
		}

		const searchResult = await this.searchTextTool.execute({
			searchText: args.target,
			maxResults: 10
		})
		const firstMatch = this.selectBestMatch(searchResult.results, args.target)

		if (!firstMatch) {
			return {
				type: "assistant_message",
				action: this.action,
				content: `${args.target} not found`
			}
		}

		const fileResult = await this.readFileTool.execute({
			path: firstMatch.file
		})

		const prompt = this.promptBuilder.buildImplementationPrompt(
			args.target,
			fileResult.content
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
			action: this.action,
			content: answer.content
		}
	}

	private parseArgs(args: IAgentDecision["args"]): IInvestigateArgs | null {
		if (!args || typeof args.target !== "string" || args.target.trim() === "") {
			return null
		}

		return {
			target: args.target.trim(),
			intent: args.intent === "implementation" ? args.intent : "implementation"
		}
	}

	private selectBestMatch(
		results: Awaited<ReturnType<SearchTextTool["execute"]>>["results"],
		target: string
	) {
		const declarationPattern = new RegExp(
			`\\b(class|function|interface|type|const|let|var)\\s+${this.escapeRegExp(target)}\\b`
		)

		return (
			results.find((result) =>
				result.occurrences.some((occurrence) =>
					declarationPattern.test(occurrence.text)
				)
			) ?? results[0]
		)
	}

	private escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	}
}
