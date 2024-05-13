import { Sequelize } from 'sequelize'
import { User, sequelize } from '../db'
import { Op } from 'sequelize'
import { generateKeyPairSync } from 'crypto'

const usersToUpdate = User.findAll({
  where: {
    url: { [Op.notLike]: '@%' }
  }
})

usersToUpdate.then((users: any[]) => {
  users.forEach((user: any) => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })
    user.publicKey = publicKey
    user.privateKey = privateKey
    console.log(`updating ${user.url}`)

    user.save().then(() => {
      console.log(`Updated ${user.url}`)
    })
  })
})
