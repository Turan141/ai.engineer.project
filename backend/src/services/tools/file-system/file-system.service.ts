import fs from "node:fs/promises"
import path from "node:path"
import type { ISearchTextResult } from "../../../shared/interfaces/ai-tools.interface.js"

interface ISearchTextOptions {
	maxResults: number
	maxFileSizeBytes: number
	maxOccurrencesPerFile: number
	maxLineLength: number
}

export class FileSystemService {
	private readonly ignoredDirectories = new Set([
		"node_modules",
		".git",
		"dist",
		"build",
		".next",
		".cache"
	])
	private readonly ignoredFileNames = new Set([
		"package-lock.json",
		"npm-shrinkwrap.json",
		"yarn.lock",
		"pnpm-lock.yaml",
		"tsconfig.tsbuildinfo"
	])
	private readonly searchableExtensions = new Set([
		".ts",
		".tsx",
		".js",
		".jsx",
		".json",
		".md",
		".css",
		".html",
		".txt",
		".env",
		".yml",
		".yaml"
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

	async searchText(
		rootDir: string,
		searchText: string,
		options: ISearchTextOptions
	): Promise<{ results: ISearchTextResult[]; truncated: boolean }> {
		const files = await this.getFiles(rootDir)

		const results: ISearchTextResult[] = []
		let truncated = false

		for (const file of files) {
			if (results.length >= options.maxResults) {
				truncated = true
				break
			}

			try {
				if (!this.isSearchableTextFile(file)) {
					continue
				}

				const stat = await fs.stat(file)
				if (stat.size > options.maxFileSizeBytes) {
					continue
				}

				const content = await this.readFile(file)

				const lines = content.split("\n")
				let matches = 0

				const occurrences = lines.flatMap((line, index) => {
					if (!line.includes(searchText)) {
						return []
					}

					matches += line.split(searchText).length - 1

					return [
						{
							line: index + 1,
							text:
								line.length > options.maxLineLength
									? `${line.slice(0, options.maxLineLength)}...`
									: line
						}
					]
				})

				if (occurrences.length > 0) {
					results.push({
						file,
						matches,
						occurrences: occurrences.slice(0, options.maxOccurrencesPerFile)
					})
				}
			} catch {
				// skip binary files
			}
		}

		return { results, truncated }
	}

	private isSearchableTextFile(filePath: string): boolean {
		if (this.ignoredFileNames.has(path.basename(filePath))) {
			return false
		}

		return this.searchableExtensions.has(path.extname(filePath))
	}
}
