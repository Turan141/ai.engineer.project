import path from "node:path"

import type { FileSystemService } from "./file-system.service.js"
import type { IReplaceToolTextArgs } from "../../shared/interfaces/ai-tools.interface.js"

export class ReplaceTextService {
	private readonly allowedExtensions = new Set([
		".ts",
		".tsx",
		".js",
		".jsx",
		".json",
		".md"
	])

	constructor(private readonly fileSystemService: FileSystemService) {}

	async replace(params: IReplaceToolTextArgs): Promise<string[]> {
		const { searchText, replaceText, targetPath, dryRun = true } = params

		if (searchText.trim().length < 3) {
			throw new Error("searchText must be at least 3 characters")
		}

		const projectRoot = path.resolve("C:\\Users\\darkh\\ai.engineer.pet")
		const resolvedTarget = path.resolve(targetPath)

		if (!resolvedTarget.startsWith(projectRoot + path.sep)) {
			throw new Error("targetPath is outside project root")
		}

		if (
			resolvedTarget !== projectRoot &&
			!resolvedTarget.startsWith(projectRoot + path.sep)
		) {
			throw new Error("targetPath is outside project root")
		}

		const files = await this.fileSystemService.getFiles(resolvedTarget)

		const changedFiles: string[] = []

		for (const file of files) {
			try {
				const extension = path.extname(file)

				if (!this.allowedExtensions.has(extension)) {
					continue
				}

				const content = await this.fileSystemService.readFile(file)

				if (!content.includes(searchText)) {
					continue
				}

				const updatedContent = content.replaceAll(searchText, replaceText)

				if (!dryRun) {
					await this.fileSystemService.writeFile(file, updatedContent)
				} else {
					console.log(`Dry run: ${file} would be updated`)
				}

				console.log(`Updated: ${file}`)

				changedFiles.push(file)
			} catch (error) {
				console.warn(`Skipped: ${file}`, error)
			}
		}

		return changedFiles
	}
}
