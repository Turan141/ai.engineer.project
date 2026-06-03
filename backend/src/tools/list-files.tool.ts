import { config } from "../config/config.js"
import type { FileSystemService } from "../services/tools/file-system/file-system.service.js"
import type { IListFilesArgs } from "../shared/interfaces/ai-tools.interface.js"

export class ListFilesTool {
	constructor(private readonly fileSystemService: FileSystemService) {}

	async execute(args: IListFilesArgs) {
		if (!args.pattern) {
			throw new Error("Pattern argument is required")
		}

		const files = await this.fileSystemService.findFiles(
			config.workspaceRoot,
			args.pattern
		)

		return {
			files: files,
			count: files.length
		}
	}
}
