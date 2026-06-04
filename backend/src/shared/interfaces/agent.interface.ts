import type { EAgentAction } from "../enums/agent.enums.js"
import type { IInvestigateArgs } from "./planner.interface.js"

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
			metadata?: Record<string, unknown>
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
		path?: string
		targetPath?: string
		maxResults?: number
		dryRun?: boolean
		pattern?: string
		symbol?: string
		target?: IInvestigateArgs["target"]
		task?: string
		fileName?: string
		intent?: IInvestigateArgs["intent"]
		mode?: IInvestigateArgs["mode"]
	}
}

export interface IAgentHandler {
	action: EAgentAction
	execute(decision: IAgentDecision): Promise<IAgentResponse>
}
