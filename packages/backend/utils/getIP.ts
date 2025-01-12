export default function getIp(petition: any): string {
  const res = petition.header('x-forwarded-for') || petition.connection.remoteAddress
  if (res.includes(',')) {
    // WHAT THE FUCK HOW DID YOU DO THIS
    throw new Error('Invalid ip, ip has a comma')
  }
  return res
}
