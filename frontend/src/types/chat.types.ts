export interface IChatMessage {
	role: "user" | "assistant"
	content: string
}

export type { IChatMessage }
