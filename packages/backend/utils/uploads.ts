import multer from "multer";
import { environment } from "../environment.js";
import generateRandomString from "./generateRandomString.js";

const imageStorage = multer.diskStorage({
	// Destination to store image
	destination: "uploads",
	filename: (_req, file, cb) => {
		const originalNameArray = file.originalname.split(".");
		const extension = originalNameArray[originalNameArray.length - 1];
		const randomText = generateRandomString();
		cb(null, `${Date.now()}_${randomText}.${extension.toLocaleLowerCase()}`);
	},
});

function uploadHandler(
	extensionsRegex?: RegExp,
	storage?: multer.StorageEngine,
) {
	return multer({
		storage: storage ? storage : imageStorage,
		limits: {
			fileSize: environment.uploadLimit * 1024 * 1024, // 15 MB.
		},
		fileFilter(_req, file, cb) {
			const name = file.originalname.toLowerCase();
			const isFileAllowed = !(
				name.match(
					extensionsRegex
						? extensionsRegex
						: /\.(png|jpg|jpeg|gifv|gif|webp|avif|av1|mp4|mov|webm|mkv|aac|mp3|wav|ogg|oga|m4a|pdf)$/,
				) == null
			);
			cb(null, isFileAllowed);
		},
	});
}

export default uploadHandler;
