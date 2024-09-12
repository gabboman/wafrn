
import { sequelize, User } from '../db'
import { environment } from '../environment'
import { logger } from '../utils/logger'
import { Op } from 'sequelize'
import optimizeMedia from '../utils/optimizeMedia'

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
  //const medias = await Media.findAll()
  const users = await User.findAll({
    where: {
      url: {
        [Op.notLike]: '@%'
      }
    }
  })
  /*
  for (const media of medias) {
    if (media.url.indexOf('//') === -1) {
      const newUrl = await optimizeMedia(`uploads${media.url}`)
      media.url = newUrl.slice(7)
      await media.save()
    }
  }*/
  for await (const user of users) {
    const newAvatar = await optimizeMedia(`uploads${user.avatar}`, {forceImageExtension: 'webp'})
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
