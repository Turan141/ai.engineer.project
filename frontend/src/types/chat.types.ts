interface IChatMessage {
	role: "user" | "assistant"
	content: string
	metadata?: {
		file?: string
		[key: string]: unknown
	}
}

export type { IChatMessage }
