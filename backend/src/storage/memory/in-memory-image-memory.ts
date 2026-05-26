import type { IImageStore } from "../../shared/interfaces/image.interfaces.js"

export class InMemoryImageMemory implements IImageStore {
	private images: { id: string; url: string }[] = []

	async saveImage(id: string, url: string): Promise<void> {
		this.images.push({ id, url })
	}

	async getImageUrl(id: string): Promise<string | null> {
		const image = this.images.find((img) => img.id === id)
		return image ? image.url : null
	}
}
