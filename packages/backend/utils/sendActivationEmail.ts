import nodemailer from 'nodemailer'
import { completeEnvironment } from './backendOptions.js'
const transporter = nodemailer.createTransport(completeEnvironment.emailConfig)

export default async function sendActivationEmail(email: string, code: string, subject: string, contents: string) {
  // const activateLink = code;
  return await transporter.sendMail({
    from: completeEnvironment.emailConfig.auth.from,
    to: email,
    subject,
    html: contents
  })
}
