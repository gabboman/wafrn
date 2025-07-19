import axios from 'axios'
import { completeEnvironment } from './utils/backendOptions.js'

const authString = Buffer.from('admin:' + completeEnvironment.bskyPdsAdminPassword).toString('base64')

const inviteCodes = await axios.get(
  'https://' + completeEnvironment.bskyPds + '/xrpc/com.atproto.admin.getInviteCodes?limit=500',
  {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + authString
    }
  }
)

console.log(inviteCodes)
