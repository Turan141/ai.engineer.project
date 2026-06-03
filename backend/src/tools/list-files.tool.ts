import type { FileSystemService } from "../services/tools/file-system/file-system.service.js"
import type { IListFilesArgs } from "../shared/interfaces/ai-tools.interface.js"

export class ListFilesTool {
	constructor(private readonly fileSystemService: FileSystemService) {}

	async execute(args: IListFilesArgs): Promise<{
		files: string[]
		count: number
	}> {
		const files = await this.fileSystemService.getFiles(
			"C:\\Users\\darkh\\ai.engineer.pet"
			// args.pattern
		)

		return {
			files,
			count: files.length
		}
	}
}
