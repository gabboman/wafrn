import { Op } from "sequelize";
import { Follows } from "../../db.js";
import { acceptRemoteFollow } from "../activitypub/acceptRemoteFollow.js";
import { getAllLocalUserIds } from "../cacheGetters/getAllLocalUserIds.js";

async function fix() {
	const localUsers = await getAllLocalUserIds();
	const follows = await Follows.findAll({
		where: {
			accepted: true,
			followedId: {
				[Op.in]: localUsers,
			},
			followerId: {
				[Op.notIn]: localUsers,
			},
		},
	});
	for await (const follow of follows) {
		try {
			await acceptRemoteFollow(follow.followedId, follow.followerId);
		} catch (_error) {}
	}
}

fix().then(() => {});
