export interface IGenerateImageRequest {
	prompt: string
}

export interface IGenerateImageResponse {
	url: string
	id: string
}

export interface IGeneratedImage {
	id: string
	url: string
	prompt: string
	createdAt: Date
}
