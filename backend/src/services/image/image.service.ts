import type {
	IGenerateImageParams,
	IImageGenerationResult,
	IImageMetadata,
	IImageService,
	IImageStore
} from "../../shared/interfaces/image.interfaces.js"
import { ComfyUIProvider } from "../../providers/image/comfyui.provider.js"
import { uuid } from "../../utils/uuid-generation.js"

export class ImageService implements IImageService {
	constructor(
		private comfyProvider: ComfyUIProvider,
		private imageStore: IImageStore
	) {}

	async generateImage(
		params: IGenerateImageParams,
		signal: AbortSignal
	): Promise<IImageMetadata> {
		const img = await this.comfyProvider.generate(params, signal)
		const metadata: IImageMetadata = {
			id: uuid(),
			fileName: img.fileName,
			prompt: params.prompt,
			createdAt: new Date(),
			preset: "default"
		}
		await this.imageStore.save(metadata)

		return metadata
	}

	deleteImage(id: string): Promise<void> {
		return Promise.resolve()
	}
	async getImage(id: string): Promise<IImageMetadata | null> {
		const img = await this.imageStore.get(id)
		if (!img) return Promise.resolve(null)
		return img
	}
}
