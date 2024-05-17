import { FederatedHost } from '../../db'
import { logger } from '../logger'
import { getPetitionSigned } from './getPetitionSigned'
import { getRemoteActor } from './getRemoteActor'

async function searchRemoteUser(searchTerm: string, user: any) {
  const usernameAndDomain = searchTerm.split('@')
  const users: Array<any> = []
  if (searchTerm.startsWith('@') && searchTerm.length > 3 && usernameAndDomain.length === 3) {
    const userToSearch = searchTerm.substring(1)
    // fediverse users are like emails right? god I hope so
    const username = usernameAndDomain[1]
    const domain = usernameAndDomain[2]
    const domainBlocked = await FederatedHost.findOne({
      where: {
        displayName: domain,
        blocked: true
      }
    })
    if (domainBlocked) {
      return []
    }
    try {
      let remoteResponse = await getPetitionSigned(
        user,
        `https://${domain}/.well-known/webfinger/?resource=acct:${username}@${domain}`
      )
      if (!remoteResponse) {
        remoteResponse = await getPetitionSigned(
          user,
          `https://${domain}/.well-known/webfinger?resource=acct:${username}@${domain}`
        )
      }
      const links = remoteResponse.links
      for await (const responseLink of links) {
        if (responseLink.rel === 'self') {
          users.push(await getRemoteActor(responseLink.href, user, true))
        }
      }
    } catch (error) {
      logger.trace(`webfinger petition failed: ${searchTerm}`)
    }
  }
  return users
}

export { searchRemoteUser }
