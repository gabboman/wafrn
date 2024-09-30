import type { activityPubObject } from "../../interfaces/fediverse/activityPubObject.js";

function getApObjectPrivacy(
	apObject: activityPubObject,
	remoteUser: any,
): number {
	let privacy = 10;
	if (
		apObject.to &&
		(apObject.to[0]?.toString().includes(remoteUser.followersCollectionUrl) ||
			apObject.to[0]?.toString().includes("follow") ||
			apObject.to.includes(remoteUser.followersCollectionUrl) ||
			apObject.to.includes("follow"))
	) {
		privacy = 1;
	}
	if (apObject.cc?.includes("https://www.w3.org/ns/activitystreams#Public")) {
		// unlisted
		privacy = 3;
	}
	if (apObject.to?.includes("https://www.w3.org/ns/activitystreams#Public")) {
		// post is PUBLIC
		privacy = 0;
	}
	if (remoteUser.isBot) {
		privacy = privacy >= 3 ? privacy : 3;
	}

	return privacy;
}

export { getApObjectPrivacy };
