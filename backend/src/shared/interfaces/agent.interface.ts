import type { EAgentAction } from "../enums/agent.enums.js"

export type IAgentResponse =
	| {
			type: "tool"
			action: EAgentAction
			args?: unknown
	  }
	| {
			type: "assistant_message"
			action: EAgentAction
			content: string
	  }
	| {
			type: "chat"
			action: EAgentAction
			args?: unknown
	  }

export interface IAgentDecision {
	action: EAgentAction
	args?: {
		searchText?: string
		replaceText?: string
		targetPath?: string
		maxResults?: number
		dryRun?: boolean
		pattern?: string
		symbol?: string
		target?: string
		intent?: "implementation"
	}
}

export interface IAgentHandler {
	action: EAgentAction
	execute(decision: IAgentDecision): Promise<IAgentResponse>
}
