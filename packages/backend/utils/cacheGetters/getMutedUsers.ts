import { Mutes } from "../../db.js";
import { redisCache } from "../redis.js";

async function getMutedUsers(userId: string): Promise<string[]> {
	let res: string[] = [];
	const cacheResult = await redisCache.get(`mutedUsers:${userId}`);
	if (cacheResult) {
		res = JSON.parse(cacheResult);
	} else {
		const mutedUsersQuery = await Mutes.findAll({
			where: {
				muterId: userId,
			},
		});
		res = mutedUsersQuery.map((elem: any) => elem.mutedId);
		await redisCache.set(`mutedUsers:${userId}`, JSON.stringify(res));
	}
	return res;
}

export { getMutedUsers };
