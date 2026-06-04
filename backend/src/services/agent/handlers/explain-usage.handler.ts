import { EAgentAction } from "../../../shared/enums/agent.enums.js"
import type {
	IAgentDecision,
	IAgentHandler,
	IAgentResponse
} from "../../../shared/interfaces/agent.interface.js"
import type { ILLMService } from "../../../shared/interfaces/llm.interface.js"
import type { SearchTextTool } from "../../../tools/search-text.tools.js"
import type { PromptBuilderService } from "../../rag/prompt-builder.service.js"

export class ExplainUsageHandler implements IAgentHandler {
	constructor(
		readonly action: EAgentAction.EXPLAIN_USAGE | EAgentAction.EXPLAIN_SIMPLE,
		private readonly isSimple: boolean,
		private readonly llmService: ILLMService,
		private readonly promptBuilderService: PromptBuilderService,
		private readonly searchTextTool: SearchTextTool
	) {}

	async execute(decision: IAgentDecision): Promise<IAgentResponse> {
		const symbol = decision.args?.symbol

		if (typeof symbol !== "string") {
			return {
				type: "chat",
				action: EAgentAction.CHAT
			}
		}

		const searchResult = await this.searchTextTool.execute({
			searchText: symbol
		})
		const prompt = this.promptBuilderService.buildAnalysisPrompt(
			symbol,
			searchResult.results,
			this.isSimple
		)
		const response = await this.llmService.generate({
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
			content: response.content
		}
	}
}
