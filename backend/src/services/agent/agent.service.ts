import type { IAgentResponse } from "../../shared/interfaces/agent.interface.js"
import type { ILLMService } from "../../shared/interfaces/llm.interface.js"
import type { AgentHandlerRegistry } from "./handlers/agent-handler.service.js"

export class AgentService {
	constructor(
		private readonly llmService: ILLMService,
		private readonly registry: AgentHandlerRegistry
	) {}

	async handle(message: string): Promise<IAgentResponse> {
		const decision = await this.llmService.decideAction(message)

		console.log("Agent handle decision:", decision)

		return this.registry.execute(decision)
	}
}
