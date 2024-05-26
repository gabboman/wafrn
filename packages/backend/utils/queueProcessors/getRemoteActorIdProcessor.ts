import { Job } from 'bullmq'
import { Blocks, EmojiReaction, FederatedHost, Follows, Mutes, Post, PostMentionsUserRelation, User, UserLikesPostRelations, sequelize } from '../../db'
import { environment } from '../../environment'
import { getUserIdFromRemoteId } from '../cacheGetters/getUserIdFromRemoteId'
import { getFederatedHostIdFromUrl } from '../cacheGetters/getHostIdFromUrl'
import { getPetitionSigned } from '../activitypub/getPetitionSigned'
import { processUserEmojis } from '../activitypub/processUserEmojis'
import { fediverseTag } from '../../interfaces/fediverse/tags'
import { logger } from '../logger'
import { redisCache } from '../redis'

// This function will return userid after processing it.
async function getRemoteActorIdProcessor(job: Job) {
  const actorUrl: string = job.data.actorUrl
  const forceUpdate: boolean = job.data.forceUpdate
  let res = await getUserIdFromRemoteId(actorUrl)
  if (res === '' || forceUpdate) {
    const url = new URL(actorUrl)
    let federatedHost = await getHostFromCache(url.host)
    const hostBanned = federatedHost?.blocked
    if (hostBanned) {
      res = await getDeletedUser()
    } else {
      const user = await User.findByPk(job.data.userId)
      const userPetition = await getPetitionSigned(user, actorUrl)
      if (userPetition) {
        if (!federatedHost) {
          const federatedHostToCreate = {
            displayName: url.host.toLocaleLowerCase(),
            publicInbox: userPetition.endpoints?.sharedInbox
          }
          federatedHost = await FederatedHost.create(federatedHostToCreate)
        }
        const remoteMentionUrl = typeof userPetition.url === 'string' ? userPetition.url : ''
        const userData = {
          url: `@${userPetition.preferredUsername}@${url.host}`,
          name: userPetition.name ? userPetition.name : userPetition.preferredUsername,
          email: null,
          description: userPetition.summary,
          avatar: userPetition.icon?.url ? userPetition.icon.url : `${environment.mediaUrl}/uploads/default.webp`,
          headerImage: userPetition.image?.url ? userPetition.image.url : ``,
          password: 'NOT_A_WAFRN_USER_NOT_REAL_PASSWORD',
          publicKey: userPetition.publicKey?.publicKeyPem,
          remoteInbox: userPetition.inbox,
          remoteId: actorUrl,
          activated: true,
          federatedHostId: federatedHost.id,
          remoteMentionUrl: remoteMentionUrl,
          followersCollectionUrl: userPetition.followers,
          followingCollectionUrl: userPetition.following,
          isBot: userPetition.type != 'Person',
          updatedAt: new Date()
        }
        let userRes
        const existingUsers = await User.findAll({
          where: {
            url: sequelize.where(sequelize.fn('LOWER', sequelize.col('url')), 'LIKE', userData.url.toLowerCase())
          }
        })
        if (res) {
          if (res !== (await getDeletedUser())) {
            userRes = await User.findByPk(res)
            if (existingUsers && existingUsers.length > 0 && existingUsers[0] && userRes?.id !== existingUsers[0]?.id) {
              const existingUser = existingUsers[0]
              existingUser.activated = 0
              existingUser.remoteId = `${existingUser.remoteId}_OVERWRITTEN_ON${new Date().getTime()}`
              existingUser.url = `${existingUser.url}_OVERWRITTEN_ON${new Date().getTime()}`
              await existingUser.save()
              const updates = [
                Follows.update({
                followerId: userRes.id
              }, {
                where: {
                  followerId: existingUser.id
                }
              }),
              Follows.update({
                followedId: userRes.id
              }, {
                where: {
                  followedId: existingUser.id
                }
              }),
              Post.update({
                userId: userRes.id
              }, {
                where: {
                  userId: existingUser.id
                }
              }),
              UserLikesPostRelations.update({
                userId: userRes.id
              }, {
                where: {
                  userId: existingUser.id
                }
              }),
              EmojiReaction.update({
                userId: userRes.id
              }, {
                where: {
                  userId: existingUser.id
                }
              }),
              Blocks.update({
                blockedid: userRes.id
              }, {
                where: {
                  blockedid: existingUser.id
                }
              }),
              Blocks.update({
                blockerId: userRes.id
              }, {
                where: {
                  blockerId: existingUser.id
                }
              }),
              Mutes.update({
                muterid: userRes.id
              }, {
                where: {
                  muterid: existingUser.id
                }
              }),
              Mutes.update({
                mutedId: userRes.id
              }, {
                where: {
                  mutedId: existingUser.id
                }
              }),
              PostMentionsUserRelation.update({
                userid: userRes.id
              }, {
                where: {
                  userid: existingUser.id
                }
              })
            ]
              await Promise.all(updates)
              await redisCache.del('userRemoteId:' + existingUser.remoteId)
            }
            userRes.update(userData)
            await userRes.save()
          }
        } else {
          if(existingUsers && existingUsers[0]) {
            existingUsers[0].update(userData)
            await existingUsers[0].save()
          } else {
            userRes = await User.create(userData)
          }
        }
        res = userRes.id
        try {
          const emojis = [...new Set(userPetition.tag?.filter((elem: fediverseTag) => elem.type === 'Emoji'))]

          await processUserEmojis(userRes, emojis)
        } catch (error) {
          logger.info({
            message: `Error processing emojis from user ${userRes.url}`,
            error: error,
            emojis: userPetition.tag?.filter((elem: fediverseTag) => elem.type === 'Emoji')
          })
        }
      }
    }
  }
  return res
}

async function getHostFromCache(displayName: string): Promise<any> {
  const res = await FederatedHost.findByPk(await getFederatedHostIdFromUrl(displayName))
  return res
}

async function getDeletedUser() {
  return await getUserIdFromRemoteId(`https://${environment.instanceUrl}/fediverse/blog/${environment.deletedUser}`)
}

export { getRemoteActorIdProcessor }
