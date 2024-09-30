import { Op } from "sequelize";
import { User } from "../../db.js";
import getBlockedIds from "./getBlockedIds.js";
import getFollowedsIds from "./getFollowedsIds.js";

export default async function getNonFollowedLocalUsersIds(
	userId: string,
): Promise<string[]> {
	// TODO If we wanted to add cache to this, we would need to CLEAR LOCAL CACHE when registering a new user.
	try {
		const followedLocalUsers = getFollowedsIds(userId, true);
		const blockedUsers = getBlockedIds(userId);
		Promise.all([followedLocalUsers, blockedUsers]);
		const nonFollowedUsers = await User.findAll({
			attributes: ["id"],
			where: {
				id: {
					[Op.notIn]: (await followedLocalUsers).concat(await blockedUsers),
				},
				url: {
					[Op.notLike]: "@%",
				},
				banned: {
					[Op.ne]: true,
				},
			},
		});
		const result = nonFollowedUsers.map((notFollowed: any) => notFollowed.id);
		return result as string[];
	} catch (_error) {
		return [];
	}
}
