import type {
	ISearchTextArgs,
	ISearchTextResult
} from "../shared/interfaces/ai-tools.interface.js"

import type { FileSystemService } from "../services/tools/file-system/file-system.service.js"

export class SearchTextTool {
	constructor(private readonly fileSystemService: FileSystemService) {}

	async execute(args: ISearchTextArgs): Promise<{
		results: ISearchTextResult[]
		count: number
	}> {
		const results = await this.fileSystemService.searchText(
			"C:\\Users\\darkh\\ai.engineer.pet",
			args.searchText
		)

		return {
			results,
			count: results.length
		}
	}
}
