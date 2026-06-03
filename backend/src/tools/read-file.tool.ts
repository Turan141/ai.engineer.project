import type { FileSystemService } from "../services/tools/file-system/file-system.service.js"
import type { IReadFileArgs } from "../shared/interfaces/ai-tools.interface.js"

export class ReadFileTool {
	constructor(private readonly fileSystemService: FileSystemService) {}

	async execute(args: IReadFileArgs) {
		const content = await this.fileSystemService.readFile(args.path)

		return {
			path: args.path,
			content
		}
	}
}
