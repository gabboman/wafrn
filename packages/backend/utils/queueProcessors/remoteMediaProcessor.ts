import crypto from "node:crypto";
import fs from "node:fs/promises";
import axios from "axios";
import type { Job } from "bullmq";
import mime from "mime";
import { Media } from "../../db.js";
import { environment } from "../../environment.js";
import { fileTypeFromFile } from 'file-type';
import sharp from "sharp";
import { Model } from "sequelize";

async function processRemoteMedia(job: Job) {
    const media = await Media.findByPk(job.data.mediaId) as Model<any, any>;
    let fileLocation = "";
    if (media.external) {
        // TODO this code uses parts from the cacher. Could be better done? absolutely. Will do once it breaks
        // we fetch the media
        const _petition = await axios.get(
            // we call the local api
            environment.frontendUrl + '/api/cache/?media=' + encodeURIComponent(media.url),
        );
        const _secondPetition = await axios.get(
            // we call the cdn or the local url twice
            environment.externalCacheurl + encodeURIComponent(media.url),
        );
        // the local file url is....
        const mediaLinkHash = crypto
            .createHash("sha256")
            .update(media.url)
            .digest("hex");
        const mediaLinkArray = media.url.split(".");
        let linkExtension = mediaLinkArray[mediaLinkArray.length - 1]
            .toLowerCase()
            .replaceAll("/", "_");
        if (linkExtension.includes("/")) {
            linkExtension = "";
        }
        linkExtension = linkExtension.split("?")[0].substring(0, 4);
        fileLocation = linkExtension
            ? `cache/${mediaLinkHash}.${linkExtension}`
            : `cache/${mediaLinkHash}`;
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