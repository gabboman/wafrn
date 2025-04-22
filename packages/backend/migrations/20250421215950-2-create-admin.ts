import { environment } from '../environment.js'
import { Migration } from '../migrate.js';
import { generateKeyPair } from 'crypto'
import bcrypt from 'bcrypt'
import util from 'util';
import { User } from '../db.js'

const generateKeyPairAsync = util.promisify(generateKeyPair)

export const up: Migration = async function () {
  let adminUser = await User.findOne({
    where: {
      url: environment.adminUser
    }
  })
  let delUser = await User.findOne({
    where: {
      url: environment.deletedUser
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
      email: environment.adminEmail,
      description: 'Admin',
      url: environment.adminUser,
      name: environment.adminUser,
      NSFW: false,
      password: await bcrypt.hash(environment.adminPassword as string, environment.saltRounds),
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
      url: environment.deletedUser,
      name: environment.deletedUser,
      NSFW: false,
      password: await bcrypt.hash('deleted', environment.saltRounds),
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
