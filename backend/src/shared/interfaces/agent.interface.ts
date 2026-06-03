import type { EAgentAction } from "../enums/agent.enums.js"

export type TAgentActionType =
	| EAgentAction.REPLACE_TEXT
	| EAgentAction.CHAT
	| EAgentAction.LIST_FILES
	| EAgentAction.READ_FILE

export interface IAgentResponse {
	type: "message" | "tool"
	action: EAgentAction
	args?: unknown
}

export interface IAgentDecision {
	action: TAgentActionType
	args?: {
		searchText?: string
		replaceText?: string
		targetPath?: string
		dryRun?: boolean
		pattern?: string
	}
}
