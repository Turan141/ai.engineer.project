import { EAgentAction } from "../../shared/enums/agent.enums.js"
import type { IAgentDecision } from "../../shared/interfaces/agent.interface.js"
import type {
	IListFilesArgs,
	IReadFileArgs,
	IReplaceToolTextArgs,
	ISearchTextArgs
} from "../../shared/interfaces/ai-tools.interface.js"
import type { ListFilesTool } from "../../tools/list-files.tool.js"
import type { ReadFileTool } from "../../tools/read-file.tool.js"
import type { ReplaceTextTool } from "../../tools/replace-text.tool.js"
import type { SearchTextTool } from "../../tools/search-text.tools.js"

export class ToolExecutorService {
	constructor(
		private readonly replaceTextTool: ReplaceTextTool,
		private readonly listFilesTool: ListFilesTool,
		private readonly readFileTool: ReadFileTool,
		private readonly searchTextTool: SearchTextTool
	) {}
	async execute(decision: IAgentDecision): Promise<unknown> {
		switch (decision.action) {
			case EAgentAction.REPLACE_TEXT:
				return this.replaceTextTool.execute(decision?.args as IReplaceToolTextArgs)
			case EAgentAction.LIST_FILES:
				return this.listFilesTool.execute(decision?.args as IListFilesArgs)
			case EAgentAction.READ_FILE:
				return this.readFileTool.execute(decision?.args as IReadFileArgs)
			case EAgentAction.SEARCH_TEXT:
				return this.searchTextTool.execute(decision?.args as ISearchTextArgs)

			default:
				throw new Error("Unsupported action")
		}
	}
}
