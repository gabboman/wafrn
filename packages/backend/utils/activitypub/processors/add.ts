import type { activityPubObject } from "../../../interfaces/fediverse/activityPubObject.js";
import { getPostThreadRecursive } from "../getPostThreadRecursive.js";

async function AddActivity(
	body: activityPubObject,
	_remoteUser: any,
	user: any,
) {
	const apObject: activityPubObject = body;
	const postToFeature = await getPostThreadRecursive(user, apObject.object);
	if (postToFeature) {
		postToFeature.featured = true;
		await postToFeature.save();
	}
	// await signAndAccept({ body: body }, remoteUser, user)
}

export { AddActivity };
