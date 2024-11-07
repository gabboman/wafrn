import {getAtProtoSession} from "./getAtProtoSession.js";
import {sequelize, User} from "../../db.js";
import {ProfileViewBasic} from "@atproto/api/dist/client/types/app/bsky/actor/defs.js";
import {Model} from "sequelize";
import {environment} from "../../environment.js";


async function getAtprotoUser(handle: string, localUser: Model<any, any>, petitionData?: ProfileViewBasic ) {
  // we check if we found the user
  let userFound = await User.findOne({
    where: {
      bskyDid: handle
    }
  });
  // sometimes we can get the dids and if its a local user we just return it and thats it
  if(userFound && !userFound.url.startsWith('@')) {
    return userFound;
  }
  // We check if the user is local.
  if(handle.endsWith('.' + environment.bskyPds)) {
    let userUrl = handle.split('.' + environment.bskyPds)[0];
    if(userUrl.startsWith('@')){
      userUrl = userUrl.split('@')[1];
    }
    if(userUrl.includes('.')) {
      return;
    }
    return User.findOne({
      where:{
        literal: sequelize.where(
          sequelize.fn('lower', sequelize.col('url')), userUrl)
      }
    })
  }
  const agent = await getAtProtoSession(localUser);
  // TODO check if current user exist
  const bskyUserResponse = petitionData ? {success: true, data: petitionData} :await agent.getProfile({ actor: handle });
  if(bskyUserResponse.success) {
    const data = bskyUserResponse.data;
    const newData = {
      bskyDid: data.did,
      url: '@' + data.handle,
      name: data.displayName,
      avatar: data.avatar,
      description: data.description,
      followingCount:  data.followsCount,
      followersCount: data.followersCount,
      headerImage: data.banner,
      // bsky does not has this function lol
      manuallyAcceptsFollows: false,
      updatedAt: new Date()
    }
    userFound = await User.findOne({
      where: {
        bskyDid: data.did
      }
    });
    if(userFound) {
      await userFound.update(newData);
      await userFound.save();
    }else {
      userFound = await User.create(newData)
    }
    return userFound
  }
}

export {getAtprotoUser};
