import type { EAgentAction } from "../enums/agent.enums.js"

export interface IAgentResponse {
	type: "message" | "tool"
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
	}
}
