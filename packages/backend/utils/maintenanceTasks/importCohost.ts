
// HOW MANY PEOPLE IS GOING TO ASK FOR THIS?
// I DONT KNOW. HENCE WHY THIS IS GONA BE DONE MANUALY BY ADMIN
import fs from 'fs/promises'
import showdown from 'showdown'
import optimizeMedia from '../optimizeMedia.js'
import generateRandomString from '../generateRandomString.js'
import { Ask, Media, Post } from '../../models/index.js'
const markdownConverter = new showdown.Converter({
    simplifiedAutoLink: true,
    literalMidWordUnderscores: true,
    strikethrough: true,
    simpleLineBreaks: true,
    openLinksInNewWindow: true,
    emoji: true
})

interface Attachment {
    kind: string,
    fileURL: string,
    attachmentId: string,
    altText: string,
    width: number,
    height: number
}

interface Block {
    type: 'markdown' | 'attachment' | 'ask' | 'attachment-row',
    markdown?: { content: string },
    ask?: {
        content: string,
        sentAt: string,

    }
    attachment?: Attachment,
    attachments?: Block[]
}

// replace id of user
const USERID = "9eccdd6a-8da7-4ded-9ff3-9a2d40be6889";

const exportPostsRoute = '/Users/gabriel/Downloads/export-21837-1208175935262557921/project/UnregisteredHyperCadence/posts/published'
const asksRoute = '/Users/gabriel/Downloads/export-21837-1208175935262557921/asks'
const postsToImportFolder = await fs.readdir(exportPostsRoute);

for await (const postToImportFolder of postsToImportFolder) {
    const postsToImportFolder = await fs.readdir(exportPostsRoute + '/' + postToImportFolder);
    const postJson = JSON.parse(await fs.readFile(exportPostsRoute + '/' + postToImportFolder + '/post.json', 'utf8'))
    const post = await Post.create({ userId: USERID, createdAt: new Date(postJson.publishedAt) })
    let postContent = `<h3>${postJson.headline}</h3>`;
    let mediaIndex = 1;
    const blocks: {
        type: 'markdown' | 'attachment' | 'ask' | 'attachment-row',
        markdown?: { content: string },
        ask?: {
            content: string,
            sentAt: string,

        }
        attachment?: Attachment,
        attachments?: Block[]
    }[] = postJson.blocks;
    for await (const block of blocks) {
        switch (block.type) {
            case 'markdown': {
                postContent = postContent + markdownConverter.makeHtml(block.markdown?.content as string) + '<br>'
                break;
            }
            case 'ask': {
                // TODO attach ask to post.
                const askData = await Ask.create({
                    question: block.ask?.content,
                    createdAt: new Date(block.ask?.sentAt as string),
                    updatedAt: new Date(block.ask?.sentAt as string),
                    answered: true,
                    postId: post.id
                })
                break;
            }
            case 'attachment':
            case 'attachment-row': {
                const attachments = block.attachment ? [block.attachment] : block.attachments?.map(elem => elem.attachment) as Attachment[]
                for await (const attachment of attachments) {
                    try {
                        const fileName = attachment.fileURL.split('/')[attachment.fileURL.split('/').length - 1]
                        const fileLocation = exportPostsRoute + '/' + postToImportFolder + '/' + fileName
                        const newLocation = 'uploads/' + generateRandomString() + '.' + fileName.split('.')[fileName.split('.').length - 1]
                        await fs.copyFile(fileLocation, newLocation)
                        const filenameresult = await optimizeMedia(newLocation)
                        await Media.create({
                            mediaOrder: mediaIndex,
                            NSFW: false,
                            description: attachment.altText,
                            url: filenameresult.slice('/uploads'.length - 1),
                            external: false,
                            postId: post.id
                        })
                        postContent = postContent + `![media-${mediaIndex}]<br>`
                        mediaIndex = mediaIndex + 1;
                    } catch (err) {
                        console.log(err)
                    }

                }
            }
        }


    }
    post.content = postContent
    post.privacy = 0;
    await post.save()
}


console.log('TASK COMPLETED')
