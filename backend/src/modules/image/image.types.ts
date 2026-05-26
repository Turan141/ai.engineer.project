export interface IGenerateImageParams {
	prompt: string
	negativePrompt?: string
	width?: number
	height?: number
}

export interface IImageGenerationResult {
	imageUrl: string
}

export interface IImageProvider {
	generate(params: IGenerateImageParams): Promise<IImageGenerationResult>
}
