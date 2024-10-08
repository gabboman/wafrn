import { sequelize, User } from '../db.js'
import { environment } from '../environment.js'
import { logger } from '../utils/logger.js'
import { Op } from 'sequelize'
import optimizeMedia from '../utils/optimizeMedia.js'

sequelize
  .sync({
    force: false
  })
  .then(async () => {
    logger.info('Database & tables ready!')
    if (false) {
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
      },
      avatar: {
        [Op.like]: '%avif'
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
  for await (const user of users.filter((usr: any) => usr.avatar)) {
    try {
      const newAvatar = await optimizeMedia(`uploads${user.avatar}`, { forceImageExtension: 'webp' })
      user.avatar = newAvatar.slice(7)
      await user.save()
    } catch (error) {
      logger.warn(error)
    }
  }
}

start()
  .then(() => {
    logger.info('all good')
  })
  .catch((error) => {
    logger.warn(error)
  })
