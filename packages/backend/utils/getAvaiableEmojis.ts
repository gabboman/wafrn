import { Emoji } from "../db";

async function getAvaiableEmojis(): Promise<any[]> {
    return  await Emoji.findAll({
        where: {
          external: false
        }
      })
}

export {getAvaiableEmojis}