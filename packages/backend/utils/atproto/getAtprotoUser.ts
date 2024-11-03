import {getAtProtoSession} from "./getAtProtoSession.js";
import {User} from "../../db.js";


async function getAtprotoUser(handle, localUser) {
  const agent = await getAtProtoSession(localUser);
  // TODO check if current user exist
  const bskyUserResponse = await agent.getProfile({ actor: handle });
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
    }
    let userFound = await User.findOne({
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
