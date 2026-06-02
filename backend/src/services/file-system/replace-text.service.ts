import type { FileSystemService } from "./file-system.service.js"

export class ReplaceTextService {
	constructor(private readonly fileSystemService: FileSystemService) {}

	async replace(
		rootDir: string,
		searchText: string,
		replaceText: string
	): Promise<string[]> {
		const files = await this.fileSystemService.getFiles(rootDir)

		const changedFiles: string[] = []

		for (const file of files) {
			const content = await this.fileSystemService.readFile(file)

			if (!content.includes(searchText)) {
				continue
			}

			const updatedContent = content.replaceAll(searchText, replaceText)

			await this.fileSystemService.writeFile(file, updatedContent)

			changedFiles.push(file)
		}

		return changedFiles
	}
}
