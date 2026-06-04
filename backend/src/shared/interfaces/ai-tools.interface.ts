export interface ITool {
	name: string
	description: string
	execute?(args: unknown): Promise<unknown>
	listFiles?(rootDir: string, pattern?: string): Promise<string[]>
}

export interface IReplaceToolTextArgs {
	targetPath?: string
	searchText: string
	replaceText: string
	dryRun?: boolean
}

export interface IReplaceToolTextResult {
	files: string[]
	count: number
}

export interface IListFilesArgs {
	fileName?: string
	pattern?: string
}

export interface IListFilesResult {
	files: string[]
	count: number
}

export interface IReadFileArgs {
	path: string
}

export interface IReadFileResult {
	content: string
	path: string
}

export interface ISearchTextArgs {
	searchText: string
	targetPath?: string
	maxResults?: number
}

export interface ISearchTextOccurrence {
	line: number
	text: string
}

export interface ISearchTextResult {
	file: string
	occurrences: ISearchTextOccurrence[]
	matches: number
}

export interface ISearchTextToolResult {
	results: ISearchTextResult[]
	count: number
	truncated: boolean
	maxResults: number
}
