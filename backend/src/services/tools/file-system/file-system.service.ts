import fs from "node:fs/promises"
import path from "node:path"
import type { ISearchTextResult } from "../../../shared/interfaces/ai-tools.interface.js"

export class FileSystemService {
	private readonly ignoredDirectories = new Set([
		"node_modules",
		".git",
		"dist",
		"build",
		".next",
		".cache"
	])

	async getFiles(rootDir: string): Promise<string[]> {
		const files: string[] = []

		await this.scan(rootDir, files)

		return files
	}

	async findFiles(rootDir: string, pattern: string): Promise<string[]> {
		const files = await this.getFiles(rootDir)

		return files.filter((file) => file.toLowerCase().includes(pattern.toLowerCase()))
	}

	async scan(currentDir: string, files: string[]): Promise<void> {
		try {
			const entries = await fs.readdir(currentDir, {
				withFileTypes: true
			})

			for (const entry of entries) {
				const fullPath = path.join(currentDir, entry.name)

				if (entry.isDirectory()) {
					if (this.ignoredDirectories.has(entry.name)) {
						continue
					}

					await this.scan(fullPath, files)
					continue
				}

				files.push(fullPath)
			}
		} catch (error) {
			console.warn(`Cannot access: ${currentDir}`)
		}
	}

	async readFile(filePath: string): Promise<string> {
		return fs.readFile(filePath, "utf8")
	}

	async writeFile(filePath: string, content: string): Promise<void> {
		await fs.writeFile(filePath, content, "utf8")
	}

	async searchText(rootDir: string, searchText: string): Promise<ISearchTextResult[]> {
		const files = await this.getFiles(rootDir)

		const results: ISearchTextResult[] = []

		for (const file of files) {
			try {
				const content = await this.readFile(file)

				const matches = content.split(searchText).length - 1

				if (matches > 0) {
					results.push({
						file,
						matches
					})
				}
			} catch {
				// skip binary files
			}
		}

		return results
	}
}
