import { getAtProtoSession } from './getAtProtoSession.js'
import { sequelize, User } from '../../db.js'
import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs.js'
import { Model, Op } from 'sequelize'
import { environment } from '../../environment.js'
import _ from 'underscore'
import { wait } from '../../utils/wait.js'

async function forcePopulateUsers(dids: string[], localUser: Model<any, any>) {
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
            return {
              bskyDid: data.did,
              url: '@' + (data.handle === 'handle.invalid' ? `handle.invalid${data.did}` : data.handle),
              name: data.displayName ? data.displayName : data.handle,
              avatar: data.avatar,
              description: data.description,
              followingCount: data.followsCount,
              followersCount: data.followersCount,
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

async function getAtprotoUser(handle: string, localUser: Model<any, any>, petitionData?: ProfileViewBasic) {
  // we check if we found the user
  let userFound =
    handle == 'handle.invalid'
      ? undefined
      : await User.findOne({
          where: {
            [Op.or]: [
              {
                bskyDid: handle
              },
              {
                literal: sequelize.where(sequelize.fn('lower', sequelize.col('url')), handle.toLowerCase())
              }
            ]
          }
        })
  // sometimes we can get the dids and if its a local user we just return it and thats it
  if (userFound && !userFound.url.startsWith('@')) {
    return userFound
  }
  // We check if the user is local.
  if (handle.endsWith('.' + environment.bskyPds)) {
    let userUrl = handle.split('.' + environment.bskyPds)[0]
    if (userUrl.startsWith('@')) {
      userUrl = userUrl.split('@')[1]
    }
    if (userUrl.includes('.')) {
      return
    }
    return User.findOne({
      where: {
        literal: sequelize.where(sequelize.fn('lower', sequelize.col('url')), userUrl)
      }
    })
  }
  const agent = await getAtProtoSession(localUser)
  // TODO check if current user exist
  let bskyUserResponse = petitionData ? { success: true, data: petitionData } : undefined
  if (!bskyUserResponse) {
    try {
      bskyUserResponse = await agent.getProfile({ actor: handle })
    } catch (error) {
      return await User.findOne({
        where: {
          url: environment.deletedUser
        }
      })
    }
  }
  if (bskyUserResponse.success) {
    const data = bskyUserResponse.data
    const newData = {
      bskyDid: data.did,
      url: '@' + (data.handle === 'handle.invalid' ? `handle.invalid${data.did}` : data.handle),
      name: data.displayName ? data.displayName : data.handle,
      avatar: data.avatar,
      description: data.description,
      followingCount: data.followsCount,
      followersCount: data.followersCount,
      headerImage: data.banner,
      // bsky does not has this function lol
      manuallyAcceptsFollows: false,
      updatedAt: new Date(),
      activated: true
    }
    userFound = userFound ? userFound : await internalGetDBUser(newData.bskyDid, newData.url)
    if (userFound && !userFound.email) {
      await userFound.update(newData)
      await userFound.save()
    } else {
      try {
        userFound = await User.create(newData)
      } catch (error) {
        // not the best solution but yeah that should work
        await wait(1500)
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
        {
          url: url
        }
      ]
    }
  })
  if ([0, 1].includes(foundUsers.length)) {
    return foundUsers[0]
  } else {
    // OH WOW SOMETHING OFF
    foundUsers.forEach(async (usr) => {
      usr.url = `handle.invalid_${usr.bskyDid}_${new Date().getTime()}`
      await usr.save()
    })
    return foundUsers.find((elem) => elem.bskyDid === did)
  }
}
export { getAtprotoUser, forcePopulateUsers }
