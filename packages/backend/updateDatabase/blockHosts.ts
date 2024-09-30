import axios from "axios";
import { FederatedHost, User } from "../db.js";
import { environment } from "../environment.js";
//const { csv } = require("csv-parse");

async function blockHosts() {
	const ignoreHostsList = environment.ignoreBlockHosts;
	const _deletedUser = environment.forceSync
		? undefined
		: await User.findOne({
				where: {
					url: environment.deletedUser,
				},
			});
	const remoteData = await axios.get(environment.blocklistUrl);
	const hostLines: string[] = remoteData.data.split("\n");
	//hostLines.forEach(async (line, index) => {
	let index = 0;
	for await (const line of hostLines) {
		if (index !== 0) {
			const urlToBlock = line.split(",")[0];
			if (ignoreHostsList.includes(urlToBlock)) {
			} else {
				const hostToBlock = await FederatedHost.findOne({
					where: {
						displayName: urlToBlock,
					},
				});
				if (hostToBlock) {
					hostToBlock.blocked = true;
					hostToBlock.updatedAt = new Date();
					await hostToBlock.save();
				} else {
					const _tmp = await FederatedHost.create({
						displayName: urlToBlock,
						blocked: true,
					});
				}
			}
		}
		index += 1;
	}
}

blockHosts()
	.then(() => {})
	.catch((_error) => {});
