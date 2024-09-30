import type { Application, Response } from "express";
import { User } from "../db.js";
import { environment } from "../environment.js";
import type AuthorizedRequest from "../interfaces/authorizedRequest.js";
import { remoteUnfollow } from "../utils/activitypub/remoteUnfollow.js";
import { authenticateToken } from "../utils/authenticateToken.js";
import { getUserOptions } from "../utils/cacheGetters/getUserOptions.js";
import { follow } from "../utils/follow.js";
import { logger } from "../utils/logger.js";
import { redisCache } from "../utils/redis.js";

export default function followsRoutes(app: Application) {
	app.post(
		"/api/follow",
		authenticateToken,
		async (req: AuthorizedRequest, res: Response) => {
			let success = false;
			try {
				const posterId = req.jwtData?.userId
					? req.jwtData.userId
					: environment.deletedUser;
				const options = await getUserOptions(posterId);
				const userFederatesWithThreads = options.filter(
					(elem) =>
						elem.optionName === "wafrn.federateWithThreads" &&
						elem.optionValue === "true",
				);
				if (userFederatesWithThreads.length === 0) {
					const userToBeFollowed = await User.findByPk(req.body.userId);
					if (userToBeFollowed.urlToLower.endsWith("threads.net")) {
						res.status(500);
						res.send({
							error: true,
							message:
								"You are trying to follow a threads user but you did not enable threads federation",
						});
					}
				}
				if (req.body?.userId && posterId) {
					success = await follow(posterId, req.body.userId, res);
				}
			} catch (error) {
				logger.error(error);
			}

			res.send({
				success,
			});
		},
	);

	app.post(
		"/api/unfollow",
		authenticateToken,
		async (req: AuthorizedRequest, res: Response) => {
			// TODO remote user unfollow
			let success = false;
			try {
				const posterId = req.jwtData?.userId;
				if (req.body?.userId) {
					const userUnfollowed = await User.findOne({
						where: {
							id: req.body.userId,
						},
					});

					if (userUnfollowed.remoteId) {
						const localUser = await User.findOne({ where: { id: posterId } });
						remoteUnfollow(localUser, userUnfollowed)
							//.then(() => {})
							.catch((_error) => {
								logger.info("error unfollowing remote user");
							});
					}

					userUnfollowed.removeFollower(posterId);
					redisCache.del(`follows:full:${posterId}`);
					redisCache.del(`follows:local:${posterId}`);
					redisCache.del(`follows:notYetAcceptedFollows:${posterId}`);
					success = true;
				}
			} catch (error) {
				logger.error(error);
			}

			res.send({
				success,
			});
		},
	);
}
