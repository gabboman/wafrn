import { Emoji } from '../db.js'

async function getAvaiableEmojis(): Promise<any[]> {
  return await Emoji.findAll({
    where: {
      external: false
    }
  })
}

export { getAvaiableEmojis }
