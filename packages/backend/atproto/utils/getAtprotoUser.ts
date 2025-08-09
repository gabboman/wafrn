import { getAtProtoSession } from './getAtProtoSession.js'
import { sequelize, User } from '../../models/index.js'
import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs.js'
import { Model, Op } from 'sequelize'
import _ from 'underscore'
import { wait } from '../../utils/wait.js'
import { logger } from '../../utils/logger.js'
import { getDeletedUser } from '../../utils/cacheGetters/getDeletedUser.js'
import { completeEnvironment } from '../../utils/backendOptions.js'

async function forcePopulateUsers(dids: string[], localUser: User) {
  const userFounds = await User.findAll({
    where: {
      bskyDid: {
        [Op.in]: dids
      }
    }
  })
  const foundUsersDids = userFounds.map((elem) => elem.bskyDid)
  const notFoundUsers = dids.filter((elem) => !foundUsersDids.includes(elem))
  if (notFoundUsers.length > 0) {
    const agent = await getAtProtoSession(localUser)
    const usersToGet = _.chunk(notFoundUsers, 25)
    let petitionsResult = []
    for await (const group of usersToGet) {
      const petition = await agent.getProfiles({ actors: group })
      if (petition.data.profiles && petition.data.profiles.length > 0) {
        await User.bulkCreate(
          petition.data.profiles.map((data) => {
            let avatarString = ``
            if (data.avatar) {
              let avatarCID = data.avatar.split('/')[7]
              if (avatarCID) {
                avatarString = `?cid=${avatarCID.split('@jpeg')[0]}&did=${data.did}`
              }
            }
            return {
              hideFollows: false,
              // TODO hey you should check this
              hideProfileNotLoggedIn: false,
              bskyDid: data.did,
              url: '@' + (data.handle === 'handle.invalid' ? `handle.invalid${data.did}` : data.handle),
              name: data.displayName ? data.displayName : data.handle,
              avatar: avatarString,
              description: data.description,
              followingCount: data.followsCount,
              followerCount: data.followersCount,
              headerImage: data.banner,
              // bsky does not has this function lol
              manuallyAcceptsFollows: false,
              updatedAt: new Date(),
              activated: true
            }
          })
        )
      }
    }
  }
}

async function getAtprotoUser(
  inputHandle: string,
  localUser: User,
  petitionData?: ProfileViewBasic
): Promise<User | undefined> {
  // we check if we found the user
  let avatarString = ``
  if (!inputHandle && !petitionData) {
    return (await getDeletedUser()) as User
  }
  let handle = inputHandle
  if (!inputHandle && petitionData?.did) {
    handle = petitionData.did
  }
  let userFound =
    handle == 'handle.invalid'
      ? undefined
      : await User.findOne({
          where: {
            [Op.or]: [
              {
                bskyDid: handle
              },
              sequelize.where(sequelize.fn('lower', sequelize.col('url')), handle.toLowerCase())
            ]
          }
        })
  // sometimes we can get the dids and if its a local user we just return it and thats it
  if (userFound && userFound.email) {
    return userFound
  }
  if (userFound) {
    avatarString = userFound.avatar
  }
  const agent = await getAtProtoSession(localUser)
  // TODO check if current user exist
  let bskyUserResponse = petitionData ? { success: true, data: petitionData } : undefined
  if (!bskyUserResponse) {
    try {
      bskyUserResponse = await agent.getProfile({ actor: handle })
    } catch (error) {
      return (await User.findOne({
        where: {
          url: completeEnvironment.deletedUser
        }
      })) as User
    }
  }
  if (bskyUserResponse.success) {
    const data = bskyUserResponse.data
    if (data.avatar) {
      let avatarCID = data.avatar.split('/')[7]
      if (avatarCID) {
        avatarString = `?cid=${avatarCID.split('@jpeg')[0]}&did=${data.did}`
      }
    }
    const newData = {
      hideProfileNotLoggedIn: false,
      hideFollows: false,
      bskyDid: data.did,
      url: '@' + (data.handle === 'handle.invalid' ? `handle.invalid${data.did}` : data.handle),
      name: data.displayName ? data.displayName : data.handle,
      avatar: avatarString,
      description: data.description as string,
      followingCount: data.followsCount as number,
      followerCount: data.followersCount as number,
      headerImage: data.banner as string,
      // bsky does not has this function lol
      manuallyAcceptsFollows: false,
      updatedAt: new Date(),
      activated: true
    }
    userFound = userFound ? userFound : await internalGetDBUser(newData.bskyDid, newData.url)
    if (userFound && !userFound.email) {
      // we check just in case that user with url does not exist:
      const oldUser = await User.findOne({
        where: {
          url: newData.url,
          bskyDid: {
            [Op.ne]: newData.bskyDid
          }
        }
      })
      if (oldUser) {
        logger.debug({ message: `Duplicate bsky url event`, new: newData, old: oldUser.dataValues })
        oldUser.url = `@handle.invalid${oldUser.bskyDid}${oldUser.url}`
        await oldUser.save()
      }
      await userFound.set(newData)
      await userFound.save()
    } else {
      try {
        userFound = await User.create(newData)
      } catch (error) {
        userFound = await internalGetDBUser(newData.bskyDid, newData.url)
      }
    }
    return userFound
  }
}

async function internalGetDBUser(did: string, url: string) {
  const foundUsers = await User.findAll({
    where: {
      [Op.or]: [
        {
          bskyDid: did
        },
        sequelize.where(sequelize.fn('lower', sequelize.col('url')), url.toLowerCase())
      ]
    }
  })
  if ([0, 1].includes(foundUsers.length)) {
    return foundUsers[0]
  } else {
    // OH WOW SOMETHING OFF
    foundUsers.forEach(async (usr) => {
      usr.url = `@handle.invalid_${usr.bskyDid}_${new Date().getTime()}`
      await usr.save()
    })
    return foundUsers.find((elem) => elem.bskyDid === did)
  }
}
export { getAtprotoUser, forcePopulateUsers }
