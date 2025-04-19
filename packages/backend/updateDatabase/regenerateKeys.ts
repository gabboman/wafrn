import { Sequelize } from 'sequelize'
import { User, sequelize } from '../db.js'
import { Op } from 'sequelize'
import { generateKeyPairSync } from 'crypto'

const usersToUpdate = await User.findAll({
  where: {
    email: { [Op.ne]: null },
    privateKey: { [Op.eq]: null }
  }
})
console.log(`Users to update: ${usersToUpdate.length}`)
for await (const user of usersToUpdate) {
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
  await user.save()
}
