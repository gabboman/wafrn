import { Op } from "sequelize"
import { User } from "../../db"
import { redisCache } from "../redis"
import getFollowedsIds from "./getFollowedsIds"
import { environment } from "../../environment"

async function getFollowedRemoteIds(id: string) {
    const cacheResult = await redisCache.get('remoteFollowed:' + id)
    if (cacheResult) {
        return JSON.parse(cacheResult)
    } else {
        const followedIds = await getFollowedsIds(id)
        const followedUsers = await User.findAll({
            attributes: ['remoteId', 'url', 'id'],
            where: {
                id: {
                    [Op.in]: followedIds
                }
            }
        })
        const res = followedUsers.map((usr: any) => usr.url.startsWith('@') ? usr.remoteId : `${environment.frontendUrl}/fediverse/blog/${usr.url}`)
        await redisCache.set('remoteFollowed:' + id, JSON.stringify(res), 'EX', 300)
        return res;
    }

}

export {getFollowedRemoteIds}