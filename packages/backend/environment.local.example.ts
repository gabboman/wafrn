export const environment = {
  prod: false,
  // this makes the logs really heavy, but might be useful for queries
  logSQLQueries: true,
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
  databaseConnectionString: 'postgresql://postgres:root@localhost:5432/wafrn',
  listenIp: '0.0.0.0',
  port: 9000,
  // In the case of you wantint to put fedi petitions in another thread, use a different port here. You will have to update your apache config
  fediPort: 9000,
  // If you want to run the cache routes in another port, same thing!
  cachePort: 9000,
  saltRounds: 14,
  // for jwt secret you should use something like https://www.grc.com/passwords.htm please this is SUPER DUPER SECRET.
  jwtSecret: Buffer.from('secret', 'base64'),
  // https://app.wafrn.net
  frontendUrl: 'https://localhost',
  // app.wafrn.net
  instanceUrl: 'localhost',
  // https://media.wafrn.net
  mediaUrl: 'https://localhost/api/uploads',
  // You should run also this project github.com/gabboman/fediversemediacacher. In my case, https://cache.wafrn.net/?media= The cache is there because at some point in the past I configured it to precache images. No need for it to be honest
  externalCacheurl: 'https://localhost/api/cache?media=',
  // If main cache fails due to IP limits you can install additional proxies, and use them here. The cache will try these as well before failing.
  // You can deploy https://github.com/sztupy/did-decoder-lambda this project to Netlify or Vercel as a backup for example
  externalCacheBackups: [],
  // after the first run, create the admin user. and a deleted user. You will have to edit the user url in db so it starts with an @
  adminUser: 'admin',
  // admin email wich you will recive things like "someone registred and you need to review this"
  adminEmail: 'admin@example.com',
  adminPassword: 'Password1!',
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
  frontedLocation: '${{ROOT_DIR}}/packages/frontend/dist/wafrn/browser/',
  // oh yes, you need TWO redis connections, one for queues other for cache
  bullmqConnection: {
    host: 'localhost',
    port: 6379,
    db: 0
  },
  // second database used for cache
  redisioConnection: {
    host: 'localhost',
    port: 6379,
    db: 1
  },
  // this will create a backendlog.log file on the folder superior to this one.
  pinoTransportOptions: {
    targets: [
      {
        target: 'pino/file',
        level: 0,
        options: {
          destination: 1
        }
      }
    ]
  },
  // you can try with gmail but we actually use sendinblue for this. bear in mind that this might require some fiddling in your gmail account too
  // you might need to enable https://myaccount.google.com/lesssecureapps
  // https://miracleio.me/snippets/use-gmail-with-nodemailer/
  emailConfig: {
    host: 'localhost',
    port: 587,
    auth: {
      user: 'username',
      pass: 'password',
      from: 'wafrn@example.com'
    }
  },
  // you dont have an smtp server and you want to do a single user instance? set this to true!
  disableRequireSendEmail: true,
  // if someone is trying to scrap your place you can send a funny message in some petitions (attacks to the frontend)
  blockedIps: [] as string[],
  // do you want to manually review registrations or have them open? We advice to leave this one to true
  reviewRegistrations: true,
  // if the blocklist youre using turns out to be biased you can tell the script that loads the block host to do not block these hosts
  ignoreBlockHosts: [] as string[],
  // default SEO data that will be used when trying to load server data
  defaultSEOData: {
    title: 'localhost',
    description: 'localhost, a wafrn instance',
    img: 'https://localhost/assets/logo.png'
  },
  enableBsky: false,
  bskyPds: 'pds.localhost',
  // to generate these keys use the following command: `npx web-push generate-vapid-keys`. Remember to do the environment one too!!
  webpushPrivateKey: '${{WEBPUSH_PRIVATE}}',
  webpushPublicKey: '${{WEBPUSH_PUBLIC}}',
  // this is a email that will be sent to the distribution services in the users devices in case the owner of the distribution service wants to contact the server that is sending the notifications
  webpushEmail: '${{WEBPUSH_EMAIL}}',
  frontendEnvironment: {
    logo: '/assets/logo.png',
    frontUrl: 'https://localhost',
    baseUrl: '/api',
    baseMediaUrl: '/api/uploads',
    externalCacheurl: '/api/cache?media=',
    shortenPosts: 3,
    disablePWA: false,
    maintenance: false
  }
}
