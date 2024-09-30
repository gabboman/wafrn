import { Op } from "sequelize";
import _ from "underscore";
import { logger } from "../logger.js";

export default async function getRemoteFollowers(usr: any) {
	let res = [];
	try {
		const followed = await usr.getFollowed({
			where: {
				remoteInbox: { [Op.ne]: null },
			},
		});
		res = _.groupBy(followed, "federatedHostId");
	} catch (error) {
		logger.error(error);
	}
	return res;
}
