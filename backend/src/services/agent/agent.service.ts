import { EAgentAction } from "../../shared/enums/agent.enums.js"
import type { IAgentResponse } from "../../shared/interfaces/agent.interface.js"
import type { ILLMService } from "../../shared/interfaces/llm.interface.js"

export class AgentService {
	constructor(private readonly llmService: ILLMService) {}

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

		return {
			type: "message",
			action: decision.action,
			args: decision.args
		}
	}
}
