import { Op } from "sequelize"
import { Post } from "../../db"
import { environment } from "../../environment"

async function getPostReplies(postId: string) {
    const posts = await Post.findAll({
        attributes: ['id', 'parentId', 'remotePostId', 'privacy'],
        where: {
            parentId: postId,
            privacy: {
                [Op.notIn]: [2, 10] 
            }
        }
    })
    return posts.map((elem: any) => elem.remotePostId ? elem.remotePostId : `${environment.frontendUrl}/fediverse/post/${elem.id}`)
}

export {getPostReplies}