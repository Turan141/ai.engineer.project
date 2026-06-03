import type { IAgentResponse } from "../../shared/interfaces/agent.interface.js"
import type { ILLMService } from "../../shared/interfaces/llm.interface.js"

export class AgentService {
	constructor(private readonly llmService: ILLMService) {}

	async handle(message: string): Promise<IAgentResponse> {
		const decision = await this.llmService.decideAction(message)

		if (decision.action === "replace_text") {
			return {
				type: "tool",
				data: decision,
				content: `Replace "${decision.searchText}" with "${decision.replaceText}"`
			}
		}

		return {
			type: "message",
			content: message
		}
	}
}
