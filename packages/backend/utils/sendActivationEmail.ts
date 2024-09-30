import nodemailer from "nodemailer";
import { environment } from "../environment.js";
const transporter = nodemailer.createTransport(environment.emailConfig);

export default async function sendActivationEmail(
	email: string,
	_code: string,
	subject: string,
	contents: string,
) {
	// const activateLink = code;
	return await transporter.sendMail({
		from: environment.emailConfig.auth.from,
		to: email,
		subject,
		html: contents,
	});
}
