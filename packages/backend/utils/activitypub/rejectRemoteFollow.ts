import { Follows, User } from "../../db.js";
import { environment } from "../../environment.js";
import type { activityPubObject } from "../../interfaces/fediverse/activityPubObject.js";
import { postPetitionSigned } from "./postPetitionSigned.js";

async function rejectremoteFollow(userId: string, remoteUserId: string) {
	const localUser = await User.findByPk(userId);
	const remoteUser = await User.findByPk(remoteUserId);
	const followToBeDestroyed = await Follows.findOne({
		where: {
			followedId: userId,
			followerId: remoteUserId,
		},
	});

	const apObj: activityPubObject = {
		"@context": "https://www.w3.org/ns/activitystreams",
		actor: `${environment.frontendUrl}/fediverse/blog/${localUser.urlToLower}`,
		id: `${environment.frontendUrl}/fediverse/reject/${encodeURIComponent(followToBeDestroyed.remoteFollowId)}`,
		type: "Reject",
		object: {
			actor: remoteUser.remoteId,
			id: followToBeDestroyed.remoteFollowId,
			object: `${environment.frontendUrl}/fediverse/blog/${localUser.urlToLower}`,
			type: "Follow",
		},
	};
	const response = await postPetitionSigned(
		apObj,
		localUser,
		remoteUser.remoteInbox,
	);
	return response;
}

export { rejectremoteFollow };
