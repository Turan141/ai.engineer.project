export interface IAgentResponse {
	type: "message" | "tool"
	content: string
	data?: unknown
}

export interface IAgentDecision {
	action: "chat" | "replace_text"
	searchText?: string
	replaceText?: string
	targetPath?: string
	dryRun?: boolean
}
