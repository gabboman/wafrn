export const environment = {
  // this makes the logs really heavy, but might be useful for queries
  prod: false,
  // this makes the logs really heavy, but might be useful for queries
  logSQLQueries: false,
  // VERY IMPORTANT. This to true DESTROYS YOUR FUCKING DATABASE. DO NOT. DO NOT. DO NOT. You set it to true the first time, create the admin user, then stop, set forcesync to false and enjoy
  forceSync: false,
  workers: {
    // if you set this to true, workers will start in the main thread. no need for starting the utils/workers.ts in other tmux tab
    mainThread: true,
    low: 5,
    medium: 10,
    high: 100
  },
  // this was a dev thing. leave to true unless you are doing stuff in local or your media url is yourinstance/uploads (not recomended)
  removeFolderNameFromFileUploads: true,
  //YOU SHOULD TOTALLY USE MYSQL AND DO NOT COMMIT THE SAME MISTAKES AS ME. Mariadb works, but there were some performance issues because indexes
  databaseConnectionString: 'mysql://user:password@127.0.0.1/databaseName',
  listenIp: '127.0.0.1',
  port: 3000,
  // this was a dev  thing might be useful some day in the future to use another process to process the /fediverse petitions
  fediPort: 3000,
  saltRounds: 14,
  // for jwt secret you should use something like https://www.grc.com/passwords.htm please this is SUPER DUPER SECRET.
  jwtSecret: 'SECRETGOESHERE',
  // https://app.wafrn.net
  frontendUrl: 'FEDIVERSE_URL_WITH_HTTPS',
  // app.wafrn.net
  instanceUrl: 'FEDIVERSE_URL_NO_PROTOCOL',
  // https://media.wafrn.net
  mediaUrl: 'MEDIA_URL_OR_API_URL',
  // You should run also this project github.com/gabboman/fediversemediacacher. In my case, https://cache.wafrn.net/?media= The cache is there because at some point in the past I configured it to precache images. No need for it to be honest
  externalCacheurl: 'FEDIVERSE_CACHE_URL_SAME_AS_ENVIRONMENT',
  // after the first run, create the admin user. and a deleted user. You will have to edit the user url in db so it starts with an @
  adminUser: 'admin',
  // after creating the deleted_user we advice to also set the user to BANNED
  deletedUser: '@deleted_user',
  // in MB. Please make sure you have the same in the frontend
  uploadLimit: 250,
  // 20 is a good number. With the new query we could investigate a higher number but no need to do it
  postsPerPage: 20,
  // trace is extreme logging. debug is ok for now
  logLevel: 'debug',
  // There is a script that loads the file from this url and blocks the servers
  blocklistUrl: '',
  // In some cases we serve the frontend with the backend with a small preprocessing. We need the location of the frontend
  frontedLocation: 'LOCATION_OF_FRONTEND_FULL_ROUTE',
  // oh yes, you need TWO reis connections, one for queues other for cache
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
          destination: '../backendlog.log'
        }
      }
    ]
  },
  // you can try with gmail but we actually use sendinblue for this. bear in mind that this might require some fiddling in your gmail account too
  // you might need to enable https://myaccount.google.com/lesssecureapps
  // https://miracleio.me/snippets/use-gmail-with-nodemailer/
  emailConfig: {
    host: 'smtp_host',
    port: 25,
    auth: {
      user: 'user',
      pass: 'password',
      from: 'from_mail'
    }
  },
  // you dont have an smtp server and you want to do a single user instance? set this to true!
  disableRequireSendEmail: false,
  // if someone is trying to scrap your place you can send a funny message in some petitions (attacks to the frontend)
  blockedIps: ['RANODM_IP'],
  // do you want to manually review registrations or have them open? We advice to leave this one to true
  reviewRegistrations: true,
  // admin email wich you will recive things like "someone registred and you need to review this"
  adminEmail: 'my@email.com',
  // if the blocklist youre using turns out to be biased you can tell the script that loads the block host to do not block these hosts
  ignoreBlockHosts: [],
  // default SEO data that will be used when trying to load server data
  defaultSEOData: {
    title: 'default title',
    description: 'defaultDescription',
    img: 'defaultImg'
  }
}
