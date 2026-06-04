import type { EAgentAction } from "../../../shared/enums/agent.enums.js"
import type {
	IAgentDecision,
	IAgentHandler,
	IAgentResponse
} from "../../../shared/interfaces/agent.interface.js"

export class ToolActionHandler implements IAgentHandler {
	constructor(readonly action: EAgentAction) {}

	async execute(decision: IAgentDecision): Promise<IAgentResponse> {
		return {
			type: "tool",
			action: this.action,
			args: decision.args
		}
	}
}
