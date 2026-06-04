import { EAgentAction } from "../../../shared/enums/agent.enums.js"
import type {
	IAgentDecision,
	IAgentHandler,
	IAgentResponse
} from "../../../shared/interfaces/agent.interface.js"

export class ChatHandler implements IAgentHandler {
	readonly action = EAgentAction.CHAT

	async execute(decision: IAgentDecision): Promise<IAgentResponse> {
		return {
			type: "chat",
			action: decision.action,
			args: decision.args
		}
	}
}
