export class ReplaceBlockTool {
	constructor(
		private readonly filePath: string,
		private readonly blockIdentifier: string,
		private readonly newContent: string
	) {}
}
