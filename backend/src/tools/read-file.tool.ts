import type { FileSystemService } from "../services/tools/file-system/file-system.service.js"
import { EAgentAction } from "../shared/enums/agent.enums.js"
import type {
	IReadFileArgs,
	IReadFileResult,
	ITool
} from "../shared/interfaces/ai-tools.interface.js"

export class ReadFileTool implements ITool {
	name = EAgentAction.READ_FILE
	description = "Read a project file"

	constructor(private readonly fileSystemService: FileSystemService) {}

	async execute(args: IReadFileArgs): Promise<IReadFileResult> {
		const content = await this.fileSystemService.readFile(args.path)

		return {
			path: args.path,
			content
		}
	}
}
