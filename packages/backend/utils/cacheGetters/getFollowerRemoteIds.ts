import { Follows, User } from "../../db.js";
import { environment } from "../../environment.js";
import { redisCache } from "../redis.js";

async function getFollowerRemoteIds(id: string) {
	const cacheResult = await redisCache.get(`remoteFollower:${id}`);
	if (cacheResult) {
		return JSON.parse(cacheResult);
	}
	const follows = await Follows.findAll({
		order: [["createdAt", "DESC"]],
		include: [
			{
				model: User,
				as: "followed",
			},
		],
		where: {
			followedId: id,
			accepted: true,
		},
	});
	const res = follows.map((follow: any) =>
		follow.followed.url.startsWith("@")
			? follow.followed.remoteId
			: `${environment.frontendUrl}/fediverse/blog/${follow.followed.url}`,
	);
	await redisCache.set(`remoteFollower:${id}`, JSON.stringify(res), "EX", 300);
	return res;
}

export { getFollowerRemoteIds };
