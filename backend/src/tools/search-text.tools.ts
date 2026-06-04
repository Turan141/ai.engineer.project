import type {
	ISearchTextArgs,
	ISearchTextResult,
	ISearchTextToolResult,
	ITool
} from "../shared/interfaces/ai-tools.interface.js"

import path from "node:path"
import { config } from "../config/config.js"
import type { FileSystemService } from "../services/tools/file-system/file-system.service.js"
import { EAgentAction } from "../shared/enums/agent.enums.js"

const DEFAULT_MAX_RESULTS = 50
const MAX_RESULTS_LIMIT = 100
const MAX_FILE_SIZE_BYTES = 512 * 1024
const MAX_OCCURRENCES_PER_FILE = 5
const MAX_LINE_LENGTH = 300

export class SearchTextTool implements ITool {
	name = EAgentAction.SEARCH_TEXT
	description = "Search text occurrences in project files"

	constructor(private readonly fileSystemService: FileSystemService) {}

	async execute(args: ISearchTextArgs): Promise<ISearchTextToolResult> {
		if (!args || typeof args.searchText !== "string") {
			throw new Error("searchText is required")
		}

		const searchText = args.searchText.trim()
		if (searchText.length < 2) {
			throw new Error("searchText must be at least 2 characters")
		}

		const maxResults = Math.min(
			Math.max(args.maxResults ?? DEFAULT_MAX_RESULTS, 1),
			MAX_RESULTS_LIMIT
		)
		const rootDir = this.resolveTargetPath(args.targetPath)
		const { results, truncated } = await this.fileSystemService.searchText(
			rootDir,
			searchText,
			{
				maxResults,
				maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
				maxOccurrencesPerFile: MAX_OCCURRENCES_PER_FILE,
				maxLineLength: MAX_LINE_LENGTH
			}
		)

		return {
			results,
			count: results.length,
			truncated,
			maxResults
		}
	}

	private resolveTargetPath(targetPath?: string): string {
		const projectRoot = path.resolve(config.workspaceRoot)
		const resolvedTarget = targetPath
			? path.resolve(projectRoot, targetPath)
			: projectRoot

		if (
			resolvedTarget !== projectRoot &&
			!resolvedTarget.startsWith(projectRoot + path.sep)
		) {
			throw new Error("targetPath is outside workspace root")
		}

		return resolvedTarget
	}
}
