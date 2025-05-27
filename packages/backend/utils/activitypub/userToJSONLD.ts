import { environment } from '../../environment.js'
import { User } from '../../models/index.js'
import { getUserEmojis } from '../cacheGetters/getUserEmojis.js'
import { getUserOptions } from '../cacheGetters/getUserOptions.js'
import { logger } from '../logger.js'
import { redisCache } from '../redis.js'
import { emojiToAPTag } from './emojiToAPTag.js'

export async function userToJSONLD(user: User) {
  const userCacheResult = await redisCache.get('fediverse:user:base:' + user.id)
  let userForFediverse: any
  if (userCacheResult) {
    userForFediverse = JSON.parse(userCacheResult)
  } else {
    const emojis = await getUserEmojis(user.id)
    const userOptions = await getUserOptions(user.id)
    let unprocessedAttachments = userOptions.find((elem) => elem.optionName === 'fediverse.public.attachment')
    let alsoKnownAs: any[] = []
    let alsoKnownAsList = userOptions.find((elem) => elem.optionName === 'fediverse.public.alsoKnownAs')
    if (alsoKnownAsList?.optionValue) {
      try {
        const parsedValue = JSON.parse(alsoKnownAsList?.optionValue)
        if (typeof parsedValue === 'string') {
          for (let elem of parsedValue.split(',')) {
            let url = new URL(elem)
            alsoKnownAs.push(url.toString())
          }
        }
      } catch (_) {}
    }
    if (user.bskyDid) {
      alsoKnownAs.push(`at://${user.bskyDid}`)
    }
    let attachments: { type: string; name: string; value: string }[] = []
    if (unprocessedAttachments) {
      try {
        const attachmentsArray: { name: string; value: string }[] = JSON.parse(unprocessedAttachments.optionValue)
        attachments = attachmentsArray.map((elem) => {
          return { ...elem, type: 'PropertyValue' }
        })
      } catch (error) {
        logger.debug({
          message: `Error parsing attachment for user ${user.url}`,
          error: error
        })
      }
    }
    userForFediverse = {
      '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
      id: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
      type: 'Person',
      attachment: attachments,
      following: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following`,
      followers: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`,
      featured: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/featured`,
      inbox: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/inbox`,
      outbox: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/outbox`,
      preferredUsername: user.url.toLowerCase(),
      name: user.name,
      summary: user.description,
      url: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
      manuallyApprovesFollowers: user.manuallyAcceptsFollows,
      discoverable: true,
      alsoKnownAs: alsoKnownAs,
      published: user.createdAt,
      tag: emojis.map((emoji: any) => emojiToAPTag(emoji)),
      endpoints: {
        sharedInbox: `${environment.frontendUrl}/fediverse/sharedInbox`
      },
      ...(user.avatar
        ? {
            icon: {
              type: 'Image',
              mediaType: 'image/webp',
              url: environment.mediaUrl + user.avatar
            }
          }
        : undefined),
      ...(user.headerImage
        ? {
            image: {
              type: 'Image',
              mediaType: 'image/webp',
              url: environment.mediaUrl + user.headerImage
            }
          }
        : undefined),
      publicKey: {
        id: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}#main-key`,
        owner: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
        publicKeyPem: user.publicKey
      }
    }

    if (user.userMigratedTo) {
      userForFediverse.migratedTo = user.userMigratedTo
    }
    redisCache.set('fediverse:user:base:' + user.id, JSON.stringify(userForFediverse), 'EX', 300)
  }
  return userForFediverse
}
