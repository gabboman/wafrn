import {
	Blocks,
	EmojiReaction,
	Follows,
	Post,
	UserLikesPostRelations,
} from "../../../db.js";
import type { activityPubObject } from "../../../interfaces/fediverse/activityPubObject.js";
import { deletePostCommon } from "../../deletePost.js";
import { logger } from "../../logger.js";
import { redisCache } from "../../redis.js";
import { getPostThreadRecursive } from "../getPostThreadRecursive.js";

async function UndoActivity(
	body: activityPubObject,
	_remoteUser: any,
	user: any,
) {
	const apObject: activityPubObject =
		body.object?.id && body.object?.type ? body.object : body;
	// TODO divide this one in files too

	// Unfollow? Destroy post? what else can be undone
	switch (apObject.type) {
		case "Block": {
			logger.info("Remove block");
			logger.debug(apObject);
			const blockToRemove = await Blocks.findOne({
				where: {
					remoteBlockId: apObject.id,
				},
			});
			if (blockToRemove) {
				await blockToRemove.destroy();
			}
			redisCache.del(`blocks:mutes:onlyUser:${user.id}`);
			redisCache.del(`blocks:mutes:${user.id}`);
			redisCache.del(`blocks:mutes:${user.id}`);
			redisCache.del(`blocks:${user.id}`);
			// await signAndAccept({ body: body }, remoteUser, user)
			break;
		}
		case "Follow": {
			const remoteFollow = await Follows.findOne({
				where: {
					// I think i was doing something wrong here. Changed so when remote unfollow does not cause you to unfollow them instead lol
					remoteFollowId: apObject.id,
				},
			});
			if (remoteFollow) {
				await remoteFollow.destroy();
			}
			// await signAndAccept({ body: body }, remoteUser, user)
			break;
		}
		case "Undo": {
			// just undo? Might be like might be something else.
			const likeToRemove = await UserLikesPostRelations.findOne({
				where: {
					remoteId: apObject.id,
				},
			});
			if (likeToRemove) {
				await likeToRemove.destroy();
			}
			const emojiReactionToRemove = await EmojiReaction.findOne({
				where: {
					remoteId: apObject.id,
				},
			});
			if (emojiReactionToRemove) {
				await emojiReactionToRemove.destroy();
			}
			// await signAndAccept({ body: body }, remoteUser, user)

			break;
		}
		case "Announce": {
			const postToDelete = await Post.findOne({
				where: {
					remotePostId: apObject.id,
				},
			});
			if (postToDelete) {
				await deletePostCommon(postToDelete.id);
			}
			// await signAndAccept({ body: body }, remoteUser, user)
			break;
		}
		case "Like": {
			const likeToRemove = await UserLikesPostRelations.findOne({
				where: {
					remoteId: apObject.id,
				},
			});
			if (likeToRemove) {
				likeToRemove.destroy();
			}
		}
		// eslint-disable-next-line no-fallthrough
		case "EmojiReact": {
			const reactionToRemove = await EmojiReaction.findOne({
				where: {
					remoteId: apObject.id,
				},
			});
			if (reactionToRemove) {
				await reactionToRemove.destroy();
			}
			// await signAndAccept({ body: body }, remoteUser, user)
			break;
		}
		// activities that we ignore:
		case "View": {
			// await signAndAccept({ body: body }, remoteUser, user)
			break;
		}
		default: {
			logger.debug({
				message: `UNDO NOT IMPLEMENTED: ${apObject.type} attemping to delete post`,
				object: apObject,
			});
			const postToDelete = await getPostThreadRecursive(user, apObject.object);
			if (postToDelete) {
				await deletePostCommon(postToDelete.id);
			}
			// await signAndAccept({ body: body }, remoteUser, user)
			logger.debug(apObject);
		}
	}
}

export { UndoActivity };
