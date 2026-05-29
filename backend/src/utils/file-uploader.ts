import multer from "multer"

export function createUpload(directory: string) {
	return multer({
		storage: multer.diskStorage({
			destination: `uploads/${directory}`,
			filename: (_, file, cb) => {
				cb(null, file.originalname)
			}
		})
	})
}
