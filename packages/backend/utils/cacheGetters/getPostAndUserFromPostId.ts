import { Op } from "sequelize";
import { Emoji, Media, Post, PostTag, User } from "../../db";
import { redisCache } from "../redis";

async function getPostAndUserFromPostId(postId: string): Promise<{found: boolean, data?: any}> {
    const cacheResult = undefined //await redisCache.get('postAndUser:' + postId)
    let res: {found: boolean, data?: any} = cacheResult ? JSON.parse(cacheResult) : {found: false}
    if(!cacheResult) {
        const dbQuery = await Post.findOne({
            include: [
              {
                model: User,
                as: 'user',
                required: true
              },
              {
                model: Post,
                as: 'quoted',
                required: false
              },
              {
                model: Post,
                as: 'parent',
                required: false,
                include: [
                    {
                        model: Media,
                        required: false
                    },
                    {
                        model: PostTag,
                        required: false
                    }
                ]
              },
              {
                model: User,
                as: 'mentionPost',
                required: false
              },
              {
                model: Media,
                required: false
            },
            {
                model: PostTag,
                required: false
            },
            {
                model: Emoji,
                required: false
            }
            ],
            where: {
              id: postId,
              privacy: {
                [Op.notIn]: [2, 10]
              }
            }
          })
        if(dbQuery) {
            res = { found: true, data: dbQuery.dataValues}
        } else {
            res = {found: false}
        }
        await redisCache.set('postAndUser:' + postId, JSON.stringify(res), 'EX', 60)
    }
    return res;
}

export {getPostAndUserFromPostId}