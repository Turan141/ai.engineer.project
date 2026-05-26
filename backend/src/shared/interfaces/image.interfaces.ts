// export type TImagePreset = "realistic" | "anime" | "fantasy"

export interface IGenerateImageParams {
	prompt: string
}

export interface IImageGenerationResult {
	url: string
	id: string
}

export interface IImageProvider {
	generate(
		params: IGenerateImageParams,
		signal: AbortSignal
	): Promise<IGenerateImageProviderResult>
}

export interface IImageService {
	generateImage(
		params: IGenerateImageParams,
		signal: AbortSignal
	): Promise<IImageGenerationResult>
	getImage(id: string): Promise<string | null>
	deleteImage(id: string): Promise<void>
}

export interface IImageStore {
	saveImage(id: string, url: string): Promise<void>
	getImageUrl(id: string): Promise<string | null>
}

export interface IImageMetadata {
	id: string
	fileName: string
	prompt: string
	preset?: string
	createdAt: Date
}

export interface IGenerateImageProviderResult {
	fileName: string
}

export interface IImagePresetService {
	get(): Promise<IGenerateImageParams>
}

interface IImagePresetConfig {
	width: number
	height: number
	workflowFile: string
}
