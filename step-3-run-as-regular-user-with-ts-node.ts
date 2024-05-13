import { generateKeyPairSync } from 'crypto'
import bcrypt from 'bcrypt'
const fs = require('fs');
const readline = require('readline')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const prompt = (query: string) => new Promise((resolve) => rl.question(query, resolve))

async function setup() {
  console.log('---- INITIALIZING WAFRN DB ---')
  /*
  console.log('Hello! Please make sure you read some of the docs at least')
  console.log('This script WILL NOT install the dependencies, so check the README.md!')
  console.log('Ok, you have created the database already right? If not, run as sudo the create_db.sh script!')
  
  const adminName = await prompt('admin user')
  const adminPassword = await prompt('admin PASSWORD')
  const adminEmail = await prompt('admin email')

  console.log('We create also a fake user for deleted user. ')
  const deletedUser = await prompt('Name of deleted user')

  console.log('----ok here weeee go ---')
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
  */
  /*
  const admin = {
    email: adminEmail,
    description: 'Admin',
    url: adminName,
    name: adminName,
    NSFW: false,
    password: await bcrypt.hash(adminPassword as string, ),
    birthDate: new Date(),
    avatar: '',
    role: 10,
    activated: true,
    registerIp: '127.0.0.1',
    lastLoginIp: '127.0.0.1',
    banned: false,
    activationCode: '',
    privateKey,
    publicKey
  }

  const deleted = {
    email: 'localhost@localhost',
    description: 'DELETED USER',
    url: deletedUser,
    name: deletedUser,
    NSFW: false,
    password: await bcrypt.hash('deleted', ),
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

  const adminUser = await User.create(admin)
  const del = await User.create(deleted)
*/
  return ''
}

setup().then(() => console.log('you can ctrl c  and exit this script now'))
