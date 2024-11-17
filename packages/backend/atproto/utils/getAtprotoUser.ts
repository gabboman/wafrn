import { getAtProtoSession } from "./getAtProtoSession.js";
import { sequelize, User } from "../../db.js";
import { ProfileViewBasic } from "@atproto/api/dist/client/types/app/bsky/actor/defs.js";
import { Model, Op } from "sequelize";
import { environment } from "../../environment.js";
import _ from "underscore";


async function forcePopulateUsers(dids: string[], localUser: Model<any, any>) {
  const userFounds = await User.findAll({
    where: {
      bskyDid: {
        [Op.in]: dids
      }
    }
  })
  const foundUsersDids = userFounds.map(elem => elem.bskyDid)
  const notFoundUsers = dids.filter(elem => !foundUsersDids.includes(elem))
  if (notFoundUsers.length > 0) {
    const agent = await getAtProtoSession(localUser);
    const usersToGet = _.chunk(notFoundUsers, 25);
    let petitionsResult = []
    for await (const group of usersToGet) {
      const petition = await agent.getProfiles({ actors: group });
      if (petition.data.profiles && petition.data.profiles.length > 0) {
        await User.bulkCreate(
          petition.data.profiles.map(data => {
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
              updatedAt: new Date()
            }
          })
        )
      }

    }
  }
}

async function getAtprotoUser(handle: string, localUser: Model<any, any>, petitionData?: ProfileViewBasic) {
  // we check if we found the user
  let userFound = handle == 'handle.invalid' ? undefined : await User.findOne({
    where: {
      [Op.or]: [
        {
          bskyDid: handle,
        },
        {
          literal: sequelize.where(sequelize.fn('lower', sequelize.col('url')), handle.toLowerCase())

        }
      ]

    }
  });
  // sometimes we can get the dids and if its a local user we just return it and thats it
  if (userFound && !userFound.url.startsWith('@')) {
    return userFound;
  }
  // We check if the user is local.
  if (handle.endsWith('.' + environment.bskyPds)) {
    let userUrl = handle.split('.' + environment.bskyPds)[0];
    if (userUrl.startsWith('@')) {
      userUrl = userUrl.split('@')[1];
    }
    if (userUrl.includes('.')) {
      return;
    }
    return User.findOne({
      where: {
        literal: sequelize.where(
          sequelize.fn('lower', sequelize.col('url')), userUrl)
      }
    })
  }
  const agent = await getAtProtoSession(localUser);
  // TODO check if current user exist
  const bskyUserResponse = petitionData ? { success: true, data: petitionData } : await agent.getProfile({ actor: handle });
  if (bskyUserResponse.success) {
    const data = bskyUserResponse.data;
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
      updatedAt: new Date()
    }
    userFound = userFound ? userFound : await User.findOne({
      where: {
        bskyDid: data.did
      }
    });
    if (userFound) {
      await userFound.update(newData);
      await userFound.save();
    } else {
      userFound = await User.create(newData)
    }
    return userFound
  }
}

export { getAtprotoUser, forcePopulateUsers };
