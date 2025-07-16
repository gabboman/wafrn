import { Migration } from '../migrate.js'
import { generateKeyPair } from 'crypto'
import bcrypt from 'bcrypt'
import util from 'util'
import { User } from '../models/index.js'
import { completeEnvironment } from '../utils/backendOptions.js'

const generateKeyPairAsync = util.promisify(generateKeyPair)

export const up: Migration = async function () {
  let adminUser = await User.findOne({
    where: {
      url: completeEnvironment.adminUser
    }
  })
  let delUser = await User.findOne({
    where: {
      url: completeEnvironment.deletedUser
    }
  })
  if (!adminUser || !delUser) {
    const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
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

    const admin = {
      email: completeEnvironment.adminEmail,
      description: 'Admin',
      url: completeEnvironment.adminUser,
      name: completeEnvironment.adminUser,
      NSFW: false,
      password: await bcrypt.hash(completeEnvironment.adminPassword as string, completeEnvironment.saltRounds),
      birthDate: new Date(),
      avatar: '',
      role: 10,
      activated: true,
      registerIp: '127.0.0.1',
      lastLoginIp: '127.0.0.1',
      banned: false,
      activationCode: '',
      privateKey,
      publicKey,
      lastTimeNotificationsCheck: new Date()
    }

    const deleted = {
      email: 'localhost@localhost',
      description: 'DELETED USER',
      url: completeEnvironment.deletedUser,
      name: completeEnvironment.deletedUser,
      NSFW: false,
      password: await bcrypt.hash('deleted', completeEnvironment.saltRounds),
      birthDate: new Date(),
      avatar: '',
      role: 0,
      activated: true,
      registerIp: '127.0.0.1',
      lastLoginIp: '127.0.0.1',
      banned: true,
      activationCode: '',
      privateKey,
      publicKey
    }

    adminUser = adminUser ? adminUser : await User.create(admin)
    delUser = delUser ? delUser : await User.create(deleted)
  }
}
