import { Op } from 'sequelize'
import { Emoji, UserEmojiRelation } from '../../db.js'
import { redisCache } from '../redis.js'

async function getUserEmojis(id: string) {
  let cacheResult = await redisCache.get('userEmojis:' + id)
  if (!cacheResult) {
    const emojiIds = await UserEmojiRelation.findAll({
      where: {
        userId: id
      }
    })
    const emojis = await Emoji.findAll({
      where: {
        id: {
          [Op.in]: emojiIds.map((elem: any) => elem.emojiId)
        }
      }
    })
    cacheResult = JSON.stringify(emojis.map((elem: any) => elem.dataValues))
    redisCache.set('userEmojis:' + id, cacheResult, 'EX', 60)
  }

  return cacheResult ? JSON.parse(cacheResult) : []
}

export { getUserEmojis }
