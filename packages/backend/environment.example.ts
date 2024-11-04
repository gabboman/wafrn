export const environment = {
  // this makes the logs really heavy, but might be useful for queries
  prod: true,
  // this makes the logs really heavy, but might be useful for queries
  logSQLQueries: false,
  workers: {
    // if you set this to true, workers will start in the main thread. no need for starting the utils/workers.ts in other tmux tab
    mainThread: true,
    low: 5,
    medium: 10,
    high: 100
  },
  // this was a dev thing. leave to true unless you are doing stuff in local or your media url is yourinstance/uploads (not recomended)
  removeFolderNameFromFileUploads: true,
  // we use now postgresql.
  databaseConnectionString: 'postgresql://MAINDB/DBNAME',
  listenIp: '127.0.0.1',
  port: APPPORT,
  // In the case of you wantint to put fedi petitions in another thread, use a different port here. You will have to update your apache config
  fediPort: APPPORT,
  // If you want to run the cache routes in another post, same thign!
  cachePort: APPPORT,

  saltRounds: 14,
  // for jwt secret you should use something like https://www.grc.com/passwords.htm please this is SUPER DUPER SECRET.
  jwtSecret: 'JWTSECRET',
  // https://app.wafrn.net
  frontendUrl: 'https://DOMAINNAME',
  // app.wafrn.net
  instanceUrl: 'DOMAINNAME',
  // https://media.wafrn.net
  mediaUrl: 'https://DOMAINNAME/api/uploads',
  // You should run also this project github.com/gabboman/fediversemediacacher. In my case, https://cache.wafrn.net/?media= The cache is there because at some point in the past I configured it to precache images. No need for it to be honest
  externalCacheurl: 'https://DOMAINNAME/api/cache/?media=',
  // after the first run, create the admin user. and a deleted user. You will have to edit the user url in db so it starts with an @
  adminUser: 'ADMINUSER',
  // admin email wich you will recive things like "someone registred and you need to review this"
  adminEmail: 'ADMINEMAIL',
  adminPassword: 'ADMINPASSWORD',
  // after creating the deleted_user we advice to also set the user to BANNED
  deletedUser: '@DELETEDUSER',
  // in MB. Please make sure you have the same in the frontend
  uploadLimit: 250,
  // 20 is a good number. With the new query we could investigate a higher number but no need to do it
  postsPerPage: 20,
  // trace is extreme logging. debug is ok for now
  logLevel: 'debug',
  // There is a script that loads the file from this url and blocks the servers
  blocklistUrl: '',
  // In some cases we serve the frontend with the backend with a small preprocessing. We need the location of the frontend
  frontedLocation: 'FRONTEND_PATH',
  // oh yes, you need TWO reis connections, one for queues other for cache
  bullmqConnection: {
    host: 'REDISHOST',
    port: REDISPORT,
    db: 0
  },
  // second database used for cache
  redisioConnection: {
    host: 'REDISHOST',
    port: REDISPORT,
    db: 1
  },
  // this will create a backendlog.log file on the folder superior to this one.
  pinoTransportOptions: {
    targets: [
      {
        target: 'pino/file',
        level: 0,
        options: {
          destination: 'logs/backendlog.log'
        }
      }
    ]
  },
  // you can try with gmail but we actually use sendinblue for this. bear in mind that this might require some fiddling in your gmail account too
  // you might need to enable https://myaccount.google.com/lesssecureapps
  // https://miracleio.me/snippets/use-gmail-with-nodemailer/
  emailConfig: {
    host: 'SMTPHOST',
    port: SMTPPORT,
    auth: {
      user: 'SMTPUSER',
      pass: 'SMTPPASSWORD',
      from: 'SMTPFROM'
    }
  },
  // you dont have an smtp server and you want to do a single user instance? set this to true!
  disableRequireSendEmail: false,
  // if someone is trying to scrap your place you can send a funny message in some petitions (attacks to the frontend)
  blockedIps: ['RANODM_IP'],
  // do you want to manually review registrations or have them open? We advice to leave this one to true
  reviewRegistrations: true,
  // if the blocklist youre using turns out to be biased you can tell the script that loads the block host to do not block these hosts
  ignoreBlockHosts: [],
  // default SEO data that will be used when trying to load server data
  defaultSEOData: {
    title: 'DOMAINNAME',
    description: 'DOMAINNAME, a wafrn instance',
    img: 'https://DOMAINNAME/assets/logo.png'
  },
  frontendEnvironment: {
    maxUploadSize: '250', // upload size in mb.
    baseUrl: 'https://DOMAINNAME/api',
    logo: '/assets/logo.png',
    baseMediaUrl: 'https://DOMAINNAME/api/uploads',
    externalCacheurl: 'https://DOMAINNAME/api/cache/?media=',
    frontUrl: 'https://DOMAINNAME',
    shortenPosts: 3,
    reviewRegistrations: true,
    disablePWA: false,
    maintenance: false,
  }
}
