export interface ITool {
	name: string
	description: string
	execute(args: unknown): Promise<unknown>
}

export interface IReplaceToolTextArgs {
	targetPath: string
	searchText: string
	replaceText: string
	dryRun?: boolean
}
