import type {
	IGenerateImageParams,
	IImagePresetService
} from "../../shared/interfaces/image.interfaces.js"

export class ImagePresetService implements IImagePresetService {
	constructor() {}
	get(): Promise<IGenerateImageParams> {
		return Promise.resolve({ prompt: "A beautiful landscape with mountains and a river" })
	}
}
