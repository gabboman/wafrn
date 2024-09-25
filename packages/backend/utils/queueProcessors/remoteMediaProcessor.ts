import { Job } from "bullmq";
import { Media } from "../../db";
import axios from "axios";
import { environment } from "../../environment";
import crypto from 'crypto'
import fs from 'fs/promises'


async function processRemoteMedia(job: Job) {
    const media = await Media.findByPk(job.data.mediaId)
    let fileLocation = ''
    if (media.external) {
        fileLocation = `uploads/${media.url}`
    } else {
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



    if (media.external) {
        // we delete the cache thing
        await fs.unlink(fileLocation)

    }
}


export { processRemoteMedia }