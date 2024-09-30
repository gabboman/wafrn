import { generateKeyPairSync } from "node:crypto";
import { Op } from "sequelize";
import { User } from "../db.js";

const usersToUpdate = User.findAll({
	where: {
		url: { [Op.notLike]: "@%" },
	},
});

usersToUpdate.then((users: any[]) => {
	users.forEach((user: any) => {
		const { publicKey, privateKey } = generateKeyPairSync("rsa", {
			modulusLength: 4096,
			publicKeyEncoding: {
				type: "spki",
				format: "pem",
			},
			privateKeyEncoding: {
				type: "pkcs8",
				format: "pem",
			},
		});
		user.publicKey = publicKey;
		user.privateKey = privateKey;

		user.save().then(() => {});
	});
});
