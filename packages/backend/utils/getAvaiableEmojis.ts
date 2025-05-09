import { Emoji } from '../models/index.js'

async function getAvaiableEmojis(): Promise<any[]> {
  return await Emoji.findAll({
    where: {
      external: false
    }
  })
}

export { getAvaiableEmojis }
