import path from "node:path"

import type { FileSystemService } from "./file-system.service.js"
import type { IReplaceToolTextArgs } from "../../../shared/interfaces/ai-tools.interface.js"

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

		const projectRoot = this.resolveProjectRoot()
		const resolvedTarget = this.resolveTargetPath(projectRoot, targetPath)

		if (!this.isInsideProject(projectRoot, resolvedTarget)) {
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

	private resolveProjectRoot(): string {
		const cwd = path.resolve(process.cwd())
		return path.basename(cwd) === "backend" ? path.dirname(cwd) : cwd
	}

	private resolveTargetPath(projectRoot: string, targetPath?: string): string {
		if (!targetPath || targetPath.trim().length === 0) {
			return projectRoot
		}

		return path.isAbsolute(targetPath)
			? path.resolve(targetPath)
			: path.resolve(projectRoot, targetPath)
	}

	private isInsideProject(projectRoot: string, targetPath: string): boolean {
		return targetPath === projectRoot || targetPath.startsWith(projectRoot + path.sep)
	}
}
