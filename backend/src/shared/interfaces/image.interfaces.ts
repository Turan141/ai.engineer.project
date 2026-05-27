// export type TImagePreset = "realistic" | "anime" | "fantasy"

export interface IGenerateImageParams {
	prompt: string
}

export interface IImageGenerationResult {
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
	getImage(id: string): Promise<IImageMetadata | null>
	deleteImage(id: string): Promise<void>
}

export interface IImageMemory {
	save(params: IImageMetadata): Promise<void>
	get(id: string): Promise<IImageMetadata | null>
	delete(id: string): Promise<void>
	list(): Promise<IImageMetadata[]>
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

export interface IGenerateImageProviderQuery {
	prompt_id: string
	number: string
}

export interface IGenerateImageProviderQueryResult {
	filename: string
	subfolder: string
	type: string
}
export interface IImagePresetService {
	get(): Promise<IGenerateImageParams>
}

interface IImagePresetConfig {
	width: number
	height: number
	workflowFile: string
}
