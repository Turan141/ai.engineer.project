import type { ITool } from "../types/chat.types.js"
import type { ReplaceTextService } from "../services/tools/file-system/replace-text.service.js"
import type {
	IReplaceToolTextArgs,
	IReplaceToolTextResult
} from "../shared/interfaces/ai-tools.interface.js"
import { EAgentAction } from "../shared/enums/agent.enums.js"

export class ReplaceTextTool implements ITool {
	name = EAgentAction.REPLACE_TEXT
	description = "Find and replace text in project files"

	constructor(private readonly replaceTextService: ReplaceTextService) {}

	async execute(params: IReplaceToolTextArgs): Promise<IReplaceToolTextResult> {
		const files = await this.replaceTextService.replace(params)

		return {
			files,
			count: files.length
		}
	}
}
