import { DataTypes, Sequelize } from 'sequelize'
import { Migration } from '../migrate.js'
import { EmojiCollection } from '../models/emojiCollection.js'
import { Emoji } from '../models/emoji.js'
import { wait } from '../utils/wait.js'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  for await (const emoji of ['waffy_cool', 'waffy_party', 'waffy_pc', 'waffy_sip', 'waffy_thumbsup']) {
    try {
      await queryInterface.sequelize.query(
        `INSERT INTO  "emojis"  ("id", "name", "url", "emojiCollectionId", "external", "createdAt", "updatedAt") VALUES (':${emoji}:',':${emoji}:', '/emojipacks/waffy/${emoji}.png', '00000000-0000-0000-0000-000000000000', false, NOW(), NOW()) `
      )
    } catch (error) {
      console.log('Failed to insert ' + emoji)
    }
  }
}
export const down: Migration = async (params) => {
  // nah
}
