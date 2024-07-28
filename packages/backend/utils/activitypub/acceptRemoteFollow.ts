import { object } from "underscore";
import { Follows, User } from "../../db"
import { environment } from "../../environment";
import { activityPubObject } from "../../interfaces/fediverse/activityPubObject"
import { postPetitionSigned } from "./postPetitionSigned";

async function acceptRemoteFollow(userId: string, remoteUserId: string){
    const localUser = await User.findByPk(userId);
    const remoteUser = await User.findByPk(remoteUserId);
    const followToBeAccepted = await Follows.findOne({
        where: {
            followedId: userId,
            followerId: remoteUserId
        }
    })

    const apObj: activityPubObject = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        actor: environment.frontendUrl + '/fediverse/blog/' + localUser.url,
        id:  `${environment.frontendUrl}/fediverse/accept/${encodeURIComponent(followToBeAccepted.remoteFollowId)}`,
        type: 'Accept',
        object: {
            actor: remoteUser.remoteId,
            id: followToBeAccepted.remoteFollowId,
            object: environment.frontendUrl + '/fediverse/blog/' + localUser.url,
            type: 'Follow'
        }
    }
    const response = await postPetitionSigned(apObj, localUser, remoteUser.remoteInbox);
    followToBeAccepted.accept = true;
    await followToBeAccepted.save()
    return response;
}

export {acceptRemoteFollow}