interface ICodePatch {
	filePath: string
	summary: string
	modifiedCode: string
}

interface IChatMessage {
	role: "user" | "assistant"
	content: string
	metadata?: {
		file?: string
		patch?: ICodePatch
		type?: string
		[key: string]: unknown
	}
}

export type { IChatMessage, ICodePatch }
