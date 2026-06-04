import { EAgentAction } from "../../../shared/enums/agent.enums.js"
import type {
	IAgentContext,
	IAgentDecision,
	IAgentHandler,
	IAgentResponse
} from "../../../shared/interfaces/agent.interface.js"

export class AgentHandlerRegistry {
	private readonly handlers = new Map<EAgentAction, IAgentHandler>()

	constructor(handlers: IAgentHandler[] = []) {
		handlers.forEach((handler) => this.registerHandler(handler))
	}

	registerHandler(handler: IAgentHandler) {
		if (this.handlers.has(handler.action)) {
			throw new Error(`Handler for action ${handler.action} is already registered`)
		}
		this.handlers.set(handler.action, handler)
	}

	getHandler(action: EAgentAction): IAgentHandler | undefined {
		return this.handlers.get(action)
	}

	async execute(
		decision: IAgentDecision,
		context: IAgentContext
	): Promise<IAgentResponse> {
		const handler = this.getHandler(decision.action) ?? this.getHandler(EAgentAction.CHAT)
		if (!handler) {
			throw new Error("Chat handler is not registered")
		}

		return handler.execute(decision, context)
	}
}
