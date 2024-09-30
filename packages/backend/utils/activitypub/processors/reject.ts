import { Follows } from "../../../db.js";
import type { activityPubObject } from "../../../interfaces/fediverse/activityPubObject.js";
import { redisCache } from "../../redis.js";
import { getRemoteActor } from "../getRemoteActor.js";

async function RejectActivity(
	body: activityPubObject,
	remoteUser: any,
	user: any,
) {
	const apObject: activityPubObject = body;
	// someone rejected your follow request :(
	const userWichFollowWasRejected = await getRemoteActor(
		apObject.object.actor,
		user,
	);
	await Follows.destroy({
		where: {
			followedId: remoteUser.id,
			followerId: userWichFollowWasRejected.id,
		},
	});
	redisCache.del(`follows:full:${userWichFollowWasRejected.id}`);
	redisCache.del(
		`follows:notYetAcceptedFollows:${userWichFollowWasRejected.id}`,
	);
	// await signAndAccept({ body: body }, remoteUser, user)
}

export { RejectActivity };
