/* eslint-disable max-len */
import type { Application, Response } from "express";
import { Media } from "../db.js";
import { authenticateToken } from "../utils/authenticateToken.js";
import uploadHandler from "../utils/uploads.js";

import { Queue } from "bullmq";
import { environment } from "../environment.js";
import type AuthorizedRequest from "../interfaces/authorizedRequest.js";
import getIp from "../utils/getIP.js";
import { logger } from "../utils/logger.js";
import optimizeMedia from "../utils/optimizeMedia.js";

const updateMediaDataQueue = new Queue("processRemoteMediaData", {
	connection: environment.bullmqConnection,
	defaultJobOptions: {
		removeOnComplete: true,
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 1000,
		},
		removeOnFail: 25000,
	},
});

export default function mediaRoutes(app: Application) {
	app.post(
		"/api/uploadMedia",
		authenticateToken,
		uploadHandler().array("image"),
		async (req: AuthorizedRequest, res: Response) => {
			let result = [];
			const picturesPromise = [] as Promise<any>[];

			if (req.files != null) {
				const files = req.files as Express.Multer.File[];
				for (const file of files) {
					let fileUrl = `/${file.path}`;
					const originalNameArray = fileUrl.split(".");
					const extension =
						originalNameArray[originalNameArray.length - 1].toLowerCase();
					const formatsToNotConvert = [
						"avif",
						"aac",
						"mp3",
						"wav",
						"ogg",
						"oga",
						"m4a",
						"pdf",
					];
					if (!formatsToNotConvert.includes(extension)) {
						fileUrl = `/${await optimizeMedia(file.path)}`;
					}
					if (environment.removeFolderNameFromFileUploads) {
						fileUrl = fileUrl.slice("/uploads/".length - 1);
					}

					const isNsfw = req.body.nsfw === "true";

					picturesPromise.push(
						Media.create({
							url: fileUrl,
							// if its marked as adult content it must be NSFW
							NSFW: isNsfw,
							userId: req.jwtData?.userId,
							description: req.body.description,
							ipUpload: getIp(req),
						}),
					);
				}

				result = await Promise.all(picturesPromise);
				const medias = await Promise.all(picturesPromise);
				await updateMediaDataQueue.addBulk(
					medias.map((media: any) => {
						return {
							name: `getMediaData${media.id}`,
							data: { mediaId: media.id },
						};
					}),
				);
			}

			res.send(result);
		},
	);

	app.get(
		"/api/updateMedia",
		authenticateToken,
		async (req: AuthorizedRequest, res: Response) => {
			let success = false;
			try {
				const posterId = req.jwtData?.userId;
				if (req.query?.id) {
					const mediaToUpdate = await Media.findOne({
						where: {
							id: req.query.id,
							userId: posterId,
						},
					});
					if (mediaToUpdate) {
						mediaToUpdate.NSFW = req.query.NSFW === "true";
						mediaToUpdate.description = req.query.description;
						await mediaToUpdate.save();
						success = true;
					}
				}
			} catch (error) {
				logger.error(error);
			}

			res.send({
				success,
			});
		},
	);
}
