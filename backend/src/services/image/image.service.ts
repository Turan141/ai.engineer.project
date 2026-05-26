import type {
	IGenerateImageParams,
	IImageGenerationResult,
	IImageService
} from "../../shared/interfaces/image.interfaces.js"
import { ComfyUIProvider } from "../../providers/image/comfyui.provider.js"
import { uuid } from "../../utils/uuid-generation.js"

export class ImageService implements IImageService {
	constructor(private comfyProvider: ComfyUIProvider) {}

	async generateImage(
		params: IGenerateImageParams,
		signal: AbortSignal
	): Promise<IImageGenerationResult> {
		const img = await this.comfyProvider.generate(params, signal)

		return Promise.resolve({
			url: `https://example.com/images/${img.fileName}`,
			id: uuid()
		})
	}
	deleteImage(id: string): Promise<void> {
		// Implement logic to delete image from storage
		return Promise.resolve()
	}
	getImage(id: string): Promise<string | null> {
		// Implement logic to retrieve image URL from storage
		return Promise.resolve(`https://example.com/images/${id}.png`)
	}
}
