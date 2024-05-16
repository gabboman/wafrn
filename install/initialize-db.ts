import {User} from '../packages/backend/db'

const fs = require('fs');
const readline = require('readline')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const prompt = (query: string) => new Promise((resolve) => rl.question(query, resolve))

async function setup() {
  console.log('---- PREPARING CONFIG FILE WITH THE DATA PROVIDED ---')

  const usr = await User.findAll()
  if(usr.length === 2) {
    console.log('all good!')
  } else {
    console.log(`We should had two users in the db, the admin and the deleted one. Instead we have ${usr.length} users`)
  }
  return ''
}

setup().then(() => console.log('you can ctrl c  and exit this script now'))
