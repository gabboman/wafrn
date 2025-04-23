import { Emoji, EmojiCollection } from '../../models/index.js'
import { redisCache } from '../redis.js'

async function getAvaiableEmojisCache(): Promise<Array<string>> {
  let res: string[] = []
  const cacheResult = await redisCache.get('avaiableEmojis')
  if (cacheResult) {
    res = JSON.parse(cacheResult)
  } else {
    const avaiableEmojis = await EmojiCollection.findAll({
      include: [{ model: Emoji }]
    })
    res = avaiableEmojis
    await redisCache.set('avaiableEmojis', JSON.stringify(res), 'EX', 600)
  }
  return res
}

export { getAvaiableEmojisCache }
