import { Job } from "bullmq";
import axios from "axios";
import { environment } from "../../environment.js";
import crypto from 'crypto'
import fs from 'fs/promises'
import mime from "mime";
import { Media } from "../../db.js";

async function processRemoteMedia(job: Job) {
    const media = await Media.findByPk(job.data.mediaId)
    let fileLocation = ''
    if (!media.external) {
        fileLocation = `uploads${media.url}`
    } else {
        // TODO this code uses parts from the cacher. Could be better done? absolutely. Will do once it breaks
        // we fetch the media
        const petition = await axios.get(environment.externalCacheurl + encodeURIComponent(media.url))
        // the local file url is....
        const mediaLinkHash = crypto.createHash('sha256').update(media.url).digest('hex')
        const mediaLinkArray = media.url.split('.')
        let linkExtension = mediaLinkArray[mediaLinkArray.length - 1].toLowerCase().replaceAll('/', '_')
        if (linkExtension.includes('/')) {
            linkExtension = ''
        }
        linkExtension = linkExtension.split('?')[0].substring(0, 4)
        fileLocation = linkExtension ? `cache/${mediaLinkHash}.${linkExtension}` : `cache/${mediaLinkHash}`
    }
    let fileType = ''
    fileType = mime.lookup(fileLocation)
    if (!media.mediaType) {
        //media.mediaType = 
    }



    if (media.external) {
        // we delete the cached file because we dont want all the files to fill our disk
        await fs.unlink(fileLocation)

    }

}


export { processRemoteMedia }
