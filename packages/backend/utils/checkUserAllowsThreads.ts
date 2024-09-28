import { SignedRequest } from '../interfaces/fediverse/signedRequest.js'
import { getUserOptions } from './cacheGetters/getUserOptions.js'

async function checkuserAllowsThreads(req: SignedRequest, user: any) {
  if (req.fediData && req.fediData.fediHost && req.fediData.fediHost.includes('threads.net')) {
    const options = await getUserOptions((await user).id)
    const userFederatesWithThreads = options.filter(
      (elem) => elem.optionName === 'wafrn.federateWithThreads' && elem.optionValue === 'true'
    )
    return userFederatesWithThreads.length > 0
  } else {
    return true
  }
}

export { checkuserAllowsThreads }
