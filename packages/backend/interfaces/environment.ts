export interface Environment {
  prod: boolean
  logSQLQueries: boolean
  workers: {
    mainThread: boolean
    low: number
    medium: number
    high: number
  }
  removeFolderNameFromFileUploads: boolean
  databaseConnectionString: string
  listenIp: string
  port: number
  fediPort: number
  cachePort: number
  saltRounds: number
  jwtSecret: Buffer
  frontendUrl: string
  instanceUrl: string
  mediaUrl: string
  externalCacheurl: string
  externalCacheBackups: string[]
  adminUser: string
  adminEmail: string
  adminPassword: string
  deletedUser: string
  uploadLimit: number
  postsPerPage: number
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | string
  blocklistUrl: string
  frontedLocation: string
  bullmqConnection: {
    host: string
    port: number
    db: number
  }
  redisioConnection: {
    host: string
    port: number
    db: number
  }
  pinoTransportOptions: {
    targets: {
      target: string
      level: number
      options: {
        destination: number
      }
    }[]
  }
  emailConfig: {
    host: string
    port: number
    auth: {
      user: string
      pass: string
      from: string
    }
  }
  disableRequireSendEmail: boolean
  blockedIps: string[]
  reviewRegistrations: boolean
  ignoreBlockHosts: string[]
  defaultSEOData: {
    title: string
    description: string
    img: string
  }
  enableBsky: boolean
  bskyPds: string
  bskyPdsUrl?: string
  bskyPdsJwtSecret?: string
  bskyPdsAdminPassword?: string
  bskyMasterInviteCode?: string
  webpushPrivateKey: string
  webpushPublicKey: string
  webpushEmail: string
  frontendEnvironment: any
}
