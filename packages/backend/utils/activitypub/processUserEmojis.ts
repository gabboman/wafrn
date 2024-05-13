import { Emoji, UserEmojiRelation } from '../../db'

async function processUserEmojis(user: any, fediEmojis: any[]) {
  await UserEmojiRelation.destroy({
    where: {
      userId: user.id
    }
  });
  await user.removeEmojis()
  await user.save()
  const emojis: any[] = []
  if (fediEmojis) {
    for await (const emoji of fediEmojis) {
      let emojiToAdd = await Emoji.findByPk(emoji.id)
      if (emojiToAdd && new Date(emojiToAdd.updatedAt).getTime() < new Date(emoji.updated).getTime()) {
        emojiToAdd.name = emoji.name
        emojiToAdd.updatedAt = new Date()
        emojiToAdd.url = emoji.icon.url
        await emojiToAdd.save()
      }
      if (!emojiToAdd) {
        emojiToAdd = await Emoji.create({
          id: emoji.id,
          name: emoji.name,
          url: emoji.icon.url,
          external: true
        })
      }
      emojis.push(emojiToAdd)
    }
  }
  return await user.setEmojis([... new Set(emojis.map((emoji: any) => emoji.id))])
}

export { processUserEmojis }
