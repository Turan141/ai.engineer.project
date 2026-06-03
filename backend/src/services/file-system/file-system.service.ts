import fs from "node:fs/promises"
import path from "node:path"

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

	private async scan(currentDir: string, files: string[]): Promise<void> {
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
}
