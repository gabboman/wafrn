import sequelize from './db'
import { Media, User } from './db'
import optimizeMedia from './utils/optimizeMedia'
import { environment } from './environment'
import { logger } from '../utils/logger'

sequelize
  .sync({
    force: environment.forceSync
  })
  .then(async () => {
    logger.info('Database & tables ready!')
    if (environment.forceSync) {
      logger.info('CLEANING DATA')
      // seeder();
    }
  })

async function start() {
  const medias = await Media.findAll()
  const users = await User.findAll()
  for (const media of medias) {
    if (media.url.indexOf('//') === -1) {
      const newUrl = optimizeMedia(`uploads${media.url}`)
      media.url = newUrl.slice(7)
      await media.save()
    }
  }
  for (const user of users) {
    const newAvatar = optimizeMedia(`uploads${user.avatar}`)
    user.avatar = newAvatar.slice(7)
    await user.save()
  }
}

start()
  .then(() => {
    logger.info('all good')
  })
  .catch(() => {
    logger.warn('oh no')
  })
