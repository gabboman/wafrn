import type { Job } from "bullmq";
import { FederatedHost, User } from "../../db.js";
import { getRemoteActor } from "../activitypub/getRemoteActor.js";
import { AcceptActivity } from "../activitypub/processors/accept.js";
import { AddActivity } from "../activitypub/processors/add.js";
import { AnnounceActivity } from "../activitypub/processors/announce.js";
import { BlockActivity } from "../activitypub/processors/block.js";
import { CreateActivity } from "../activitypub/processors/create.js";
import { DeleteActivity } from "../activitypub/processors/delete.js";
import { EmojiReactActivity } from "../activitypub/processors/emojiReact.js";
import { FollowActivity } from "../activitypub/processors/follow.js";
import { LikeActivity } from "../activitypub/processors/like.js";
import { MoveActivity } from "../activitypub/processors/move.js";
import { RejectActivity } from "../activitypub/processors/reject.js";
import { RemoveActivity } from "../activitypub/processors/remove.js";
import { UndoActivity } from "../activitypub/processors/undo.js";
import { UpdateActivity } from "../activitypub/processors/update.js";
import { removeUser } from "../activitypub/removeUser.js";
import getBlockedIds from "../cacheGetters/getBlockedIds.js";
import getUserBlockedServers from "../cacheGetters/getUserBlockedServers.js";
import { logger } from "../logger.js";

async function inboxWorker(job: Job) {
	try {
		const user = await User.findByPk(job.data.petitionBy);
		const body = job.data.petition;
		const req = { body: body };
		// little hack that should be fixed later
		if (req.body.type === "Delete" && req.body.id.endsWith("#delete")) {
			const userToRemove = await User.findOne({
				where: {
					remoteId: req.body.id.split("#")[0].toLowerCase(),
				},
			});
			if (userToRemove) {
				await removeUser(userToRemove.id);
				return;
			}
		}
		const remoteUser = await getRemoteActor(req.body.actor, user);
		const host = await FederatedHost.findOne({
			where: {
				displayName: new URL(req.body.actor).host,
			},
		});
		// we check if the user has blocked the user or the server. This will mostly work for follows and dms. Will investigate further down the line
		const userBlocks: string[] = await getBlockedIds(user.id, false, true);
		const blocksExisting = userBlocks.includes(remoteUser.id) ? 1 : 0;
		const blockedServersData = await getUserBlockedServers(user.id);
		const blocksServers = blockedServersData.find(
			(elem: any) => elem.id === host.id,
		)
			? 1
			: 0;
		if (
			(!(remoteUser?.banned || host?.blocked) &&
				blocksExisting + blocksServers === 0) ||
			req.body.type === "Undo" ||
			req.body.type === "Deletee"
		) {
			switch (req.body.type) {
				case "Accept": {
					await AcceptActivity(body, remoteUser, user);
					break;
				}
				case "Reject": {
					await RejectActivity(body, remoteUser, user);
					break;
				}
				case "Announce": {
					await AnnounceActivity(body, remoteUser, user);
					break;
				}
				case "Page":
				case "Create": {
					await CreateActivity(body, remoteUser, user);
					break;
				}
				case "Follow": {
					await FollowActivity(body, remoteUser, user);
					break;
				}
				case "Update": {
					await UpdateActivity(body, remoteUser, user);
					break;
				}
				case "Undo": {
					await UndoActivity(body, remoteUser, user);
					break;
				}
				case "Like": {
					await LikeActivity(body, remoteUser, user);
					break;
				}
				case "Delete": {
					await DeleteActivity(body, remoteUser, user);
					break;
				}
				case "EmojiReact": {
					await EmojiReactActivity(body, remoteUser, user);
					break;
				}
				case "Remove": {
					await RemoveActivity(body, remoteUser, user);
					break;
				}
				case "Add": {
					await AddActivity(body, remoteUser, user);
					break;
				}
				case "Block": {
					await BlockActivity(body, remoteUser, user);
					break;
				}

				case "Move": {
					await MoveActivity(body, remoteUser, user);
					break;
				}

				// activities that we ignore:
				case "CacheFile":
				case "Playlist":
				case "View": {
					// await signAndAccept(req, remoteUser, user)
					break;
				}

				default: {
					logger.info(`NOT IMPLEMENTED: ${req.body.type}`);
					logger.info(req.body);
				}
			}
		}
	} catch (err) {
		logger.debug(err);
		const _error = new Error("error");
	}
}

export { inboxWorker };
