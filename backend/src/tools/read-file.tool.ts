import { EAgentAction } from "../shared/enums/agent.enums.js"
import type { ITool } from "../types/chat.types.js"

export class ReadFileTool implements ITool {
	name = EAgentAction.READ_FILE
	description = "Read content of a file in the project"

	constructor() {}

	async execute(filePath: string): Promise<string> {
		// In a real implementation, you would read the file content from the filesystem.
		// Here we return a placeholder string for demonstration purposes.
		return `Content of file at path: ${filePath}`
	}
}
