import { config } from "../config/config.js"
import type { FileSystemService } from "../services/tools/file-system/file-system.service.js"
import { EAgentAction } from "../shared/enums/agent.enums.js"
import type {
	IListFilesArgs,
	IListFilesResult,
	ITool
} from "../shared/interfaces/ai-tools.interface.js"

export class ListFilesTool implements ITool {
	name = EAgentAction.LIST_FILES
	description = "List project files matching a file name or pattern"

	constructor(private readonly fileSystemService: FileSystemService) {}

	async execute(args: IListFilesArgs): Promise<IListFilesResult> {
		const pattern = args.fileName ?? args.pattern

		if (!pattern) {
			throw new Error("fileName or pattern argument is required")
		}

		const files = await this.fileSystemService.getFiles(config.workspaceRoot)
		const normalizedPattern = this.normalizeFileSearch(pattern)
		const matchedFiles = files.filter((file) => {
			const lowerFile = file.toLowerCase()
			const normalizedFile = this.normalizeFileSearch(file)

			return (
				lowerFile.includes(pattern.toLowerCase()) ||
				normalizedFile.includes(normalizedPattern)
			)
		})

		return {
			files: matchedFiles,
			count: matchedFiles.length
		}
	}

	private normalizeFileSearch(value: string): string {
		return value.toLowerCase().replace(/[^a-z0-9]/g, "")
	}
}
