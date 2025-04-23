import crypto from "node:crypto";
import fs from "node:fs/promises";
import axios from "axios";
import type { Job } from "bullmq";
import mime from "mime";
import { Media } from "../../models/index.js";
import { environment } from "../../environment.js";
import { fileTypeFromFile } from 'file-type';
import sharp from "sharp";
import { Model } from "sequelize";
import { redisCache } from "../redis.js";

async function processRemoteMedia(job: Job) {
    const media = await Media.findByPk(job.data.mediaId) as Model<any, any>;
    let fileLocation = "";
    if (media.external) {
        // call the local cache endpoint to populate redis
        const cacheUrl = environment.frontendUrl + '/api/cache/?media=' + encodeURIComponent(media.url)
        await axios.get(cacheUrl)

        // get the local file name from redis using the hash of the media url
        const mediaLinkHash = crypto.createHash('sha256').update(media.url).digest('hex')
        const localFilename = await redisCache.get(`cache:${mediaLinkHash}`)
        fileLocation = localFilename!
    } else {
        fileLocation = `uploads${media.url}`;
    }
    const fileType = await fileTypeFromFile(fileLocation)

    if (fileType?.mime) {
        media.mediaType = fileType?.mime
        if (fileType.mime.startsWith('image')) {
            const metadata = await sharp(fileLocation).metadata();
            media.height = metadata.height;
            media.width = metadata.width;
            media.updatedAt = new Date();
        }
        await media.save()
    }
}

export { processRemoteMedia };
