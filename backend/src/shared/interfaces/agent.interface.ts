export type TAgentActionType = "replace_text" | "chat"

export interface IAgentResponse {
	type: "message" | "tool"
	content: string
	data?: unknown
}

export interface IAgentDecision {
	action: TAgentActionType
	args?: {
		searchText?: string
		replaceText?: string
		targetPath?: string
		dryRun?: boolean
	}
}
