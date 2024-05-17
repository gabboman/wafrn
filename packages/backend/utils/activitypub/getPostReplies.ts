import { Post } from "../../db"
import { environment } from "../../environment"

async function getPostReplies(postId: string) {
    const posts = await Post.findAll({
        attributes: ['id', 'parentId', 'remotePostId'],
        where: {
            parentId: postId
        }
    })
    return posts.map((elem: any) => elem.remotePostId ? elem.remotePostId : `${environment.frontendUrl}/fediverse/post/${elem.id}`)
}

export {getPostReplies}