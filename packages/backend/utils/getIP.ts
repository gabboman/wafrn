export default function getIp(petition: any): string {
  return petition.header('x-forwarded-for') || petition.connection.remoteAddress
}
