import { generateKeyPairSync } from "crypto";
import { User } from "../db"
import { logger } from "./logger"
import { environment } from "../environment";
import bcrypt from 'bcrypt'

const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query: string) => new Promise((resolve) => rl.question(query, resolve));


async function setup() {
    console.log('---- WE REQUIRE FORCESYNC TRUE FOR THIS SCRIPT ---')
    const adminName = await prompt("admin user");
    const adminPassword = await prompt("admin PASSWORD");
    const adminEmail = await prompt("admin email");

    console.log('We create also a fake user for deleted user. ')
    const deletedUser = await prompt("Name of deleted user");

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
      const admin = {
        email: adminEmail,
        description: 'Admin',
        url: adminName,
        name: adminName,
        NSFW: false,
        password: await bcrypt.hash(adminPassword as string, environment.saltRounds),
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

      const deleted = 
      {
        email: 'localhost@localhost',
        description: 'DELETED USER',
        url: deletedUser,
        name: deletedUser,
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

      const adminUser = await User.create(admin)
      const del = await User.create(deleted)
      return '';


}


setup().then(() => console.log('you can ctrl c  and exit this script now'))
