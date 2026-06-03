import type { ITool } from "../types/chat.types.js"
import type { ReplaceTextService } from "../services/file-system/replace-text.service.js"
import type { IReplaceToolTextArgs } from "../shared/interfaces/ai-tools.interface.js"

export class ReplaceTextTool implements ITool {
	name = "replace_text"
	description = "Find and replace text in project files"

	constructor(private readonly replaceTextService: ReplaceTextService) {}

	async execute(
		params: IReplaceToolTextArgs
	): Promise<{ files: string[]; count: number }> {
		const files = await this.replaceTextService.replace(params)

		console.log("Files changed:", files)
		return {
			files,
			count: files.length
		}
	}
}
