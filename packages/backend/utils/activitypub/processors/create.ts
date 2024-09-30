import type { activityPubObject } from "../../../interfaces/fediverse/activityPubObject.js";
import { getPostThreadRecursive } from "../getPostThreadRecursive.js";

async function CreateActivity(
	body: activityPubObject,
	_remoteUser: any,
	user: any,
) {
	const _apObject: activityPubObject = body;
	// Create new post
	const postRecived = body.object;
	await getPostThreadRecursive(user, postRecived.id, postRecived);
	// await signAndAccept({ body: body }, remoteUser, user)
}

export { CreateActivity };
