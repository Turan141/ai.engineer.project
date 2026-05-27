import type {
	IImageMetadata,
	IImageStore
} from "../../shared/interfaces/image.interfaces.js"

export class InMemoryImageStore implements IImageStore {
	private images: IImageMetadata[] = []

	delete(id: string): Promise<void> {
		this.images = this.images.filter((img) => img.id !== id)
		return Promise.resolve()
	}

	async get(id: string): Promise<IImageMetadata | null> {
		const img = this.images.find((img) => img.id === id)
		if (!img) return Promise.resolve(null)

		return img
	}

	list(): Promise<IImageMetadata[]> {
		return Promise.resolve(
			this.images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		)
	}

	async save(params: IImageMetadata): Promise<void> {
		this.images.push(params)
	}
}
