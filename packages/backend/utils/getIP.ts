export default function getIp(petition: any, forceNoForward = false): string {
  const res = petition.header('x-forwarded-for') || petition.connection.remoteAddress
  if (res.includes(',') && forceNoForward) {
    // WHAT THE FUCK HOW DID YOU DO THIS
    throw new Error('Invalid ip, ip has a comma: ' + res)
  }
  return res
}
