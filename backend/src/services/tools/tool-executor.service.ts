import { EAgentAction } from "../../shared/enums/agent.enums.js"
import type { IAgentDecision } from "../../shared/interfaces/agent.interface.js"
import type {
	IListFilesArgs,
	IReplaceToolTextArgs
} from "../../shared/interfaces/ai-tools.interface.js"
import type { ListFilesTool } from "../../tools/list-files.tool.js"
import type { ReplaceTextTool } from "../../tools/replace-text.tool.js"

export class ToolExecutorService {
	constructor(
		private readonly replaceTextTool: ReplaceTextTool,
		private readonly listFilesTool: ListFilesTool
	) {}
	async execute(decision: IAgentDecision): Promise<unknown> {
		switch (decision.action) {
			case EAgentAction.REPLACE_TEXT:
				return this.replaceTextTool.execute(decision?.args as IReplaceToolTextArgs)
			case EAgentAction.LIST_FILES:
				return this.listFilesTool.execute(decision?.args as IListFilesArgs)
			default:
				throw new Error("Unsupported action")
		}
	}
}

// const data = resp.data as IAgentDecision | undefined
// let result: unknown

// if (
// 	data?.action === EAgentAction.REPLACE_TEXT &&
// 	typeof data.args?.searchText === "string" &&
// 	typeof data.args?.replaceText === "string"
// ) {
// 	const toolArgs = {
// 		searchText: data.args.searchText,
// 		replaceText: data.args.replaceText,
// 		dryRun: data.args.dryRun ?? false
// 	}

// 	result = await replaceTextTool.execute(
// 		data.args.targetPath
// 			? { ...toolArgs, targetPath: data.args.targetPath }
// 			: toolArgs
// 	)
// } else {
// 	res.write(`data: ${JSON.stringify({ error: "Unsupported tool action" })}\n\n`)
// 	res.write("data: [DONE]\n\n")
// 	res.end()
// 	return
// }

// res.write(
// 	`data: ${JSON.stringify({
// 		text: `Tool result: Files modified: ${(result as { files: string[] }).files.join(", ")}; Total replacements: ${(result as { count: number }).count}`
// 	})}\n\n`
// )

// res.write("data: [DONE]\n\n")
// res.end()

// return
