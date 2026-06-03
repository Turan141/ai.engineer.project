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

export interface IListFilesArgs {
	pattern?: string
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
}

export interface ISearchTextResult {
	file: string
	matches: number
}
