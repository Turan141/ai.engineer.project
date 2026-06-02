import fs from "fs/promises"
import path from "path"

export class FileSystemService {
	async getFiles(dir: string): Promise<string[]> {
		const result: string[] = []

		const scan = async (currentDir: string): Promise<void> => {
			const entries = await fs.readdir(currentDir, {
				withFileTypes: true
			})

			for (const entry of entries) {
				const fullPath = path.join(currentDir, entry.name)

				if (entry.isDirectory()) {
					await scan(fullPath)
					continue
				}

				result.push(fullPath)
			}
		}

		await scan(dir)

		return result
	}

	async readFile(filePath: string): Promise<string> {
		return fs.readFile(filePath, "utf-8")
	}

	async writeFile(filePath: string, content: string): Promise<void> {
		await fs.writeFile(filePath, content, "utf-8")
	}
}
