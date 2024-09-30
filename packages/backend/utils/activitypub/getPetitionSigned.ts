import { createHash, createSign } from "node:crypto";
import axios from "axios";
import { Op } from "sequelize";
import { User } from "../../db.js";
import { environment } from "../../environment.js";
import { logger } from "../logger.js";
import { removeUser } from "./removeUser.js";

async function getPetitionSigned(user: any, target: string): Promise<any> {
	let res;

	try {
		const url = new URL(target);
		const privKey = user.privateKey;
		const acceptedFormats = "application/activity+json,application/json";
		const _signingOptions = {
			key: privKey,
			keyId: `${environment.frontendUrl}/fediverse/blog/${user.url.toLocaleLowerCase()}#main-key`,
			algorithm: "rsa-sha256",
			authorizationHeaderName: "signature",
			headers: ["(request-target)", "host", "date", "accept"],
		};
		const sendDate = new Date();
		const stringToSign = `(request-target): get ${url.pathname}\nhost: ${
			url.host
		}\ndate: ${sendDate.toUTCString()}\naccept: ${acceptedFormats}`;

		const digest = createHash("sha256").update(stringToSign).digest("base64");
		const signer = createSign("sha256");
		signer.update(stringToSign);
		signer.end();
		const signature = signer.sign(user.privateKey).toString("base64");
		const header = `keyId="${
			environment.frontendUrl
		}/fediverse/blog/${user.url.toLocaleLowerCase()}#main-key",algorithm="rsa-sha256",headers="(request-target) host date accept",signature="${signature}"`;
		const headers = {
			"Content-Type": "application/activity+json",
			"User-Agent": environment.instanceUrl,
			Accept: acceptedFormats,
			Algorithm: "rsa-sha256",
			Host: url.host,
			Date: sendDate.toUTCString(),
			Digest: `SHA-256=${digest}`,
			Signature: header,
		};
		const axiosResponse = await axios.get(url.href, { headers: headers });
		if (axiosResponse?.headers["content-type"]?.includes("text/html")) {
			logger.trace("Petition returned HTML. throwing exception");
			throw new Error("Invalid content type");
		}
		res = axiosResponse.data;
	} catch (error: any) {
		if (error.response?.status === 410) {
			const webfingerUrl = target.split(
				".well-known/webfinger/?resource=acct:",
			)[1];
			const webFingerCase = webfingerUrl
				? webfingerUrl
				: "@@NOT_VALID_URL@@NOTVALID";
			const userToRemove = await User.findOne({
				where: {
					[Op.or]: [
						{
							remoteInbox: target,
						},
						{
							remoteId: target,
						},
						{
							url: `@${webFingerCase}`,
						},
						{
							url: webFingerCase,
						},
					],
				},
			});
			if (userToRemove) {
				await removeUser(userToRemove.id);
			}
		} else {
			logger.trace({
				message: "Error with signed get petition",
				url: target,
				error: error,
			});
		}
	}
	return res;
}

export { getPetitionSigned };
