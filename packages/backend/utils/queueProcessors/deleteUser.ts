import type { Job } from "bullmq";
import { removeUser } from "../activitypub/removeUser.js";
import { logger } from "../logger.js";
async function deleteUserWorker(job: Job) {
	try {
		await removeUser(job.data.remoteId);
	} catch (_error) {
		logger.info(`Failed to delete user ${job.data.remoteId}`);
	}
}

export { deleteUserWorker };
