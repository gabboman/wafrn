import { Environment } from './interfaces/environment.js'

export const baseEnvironment: Environment = {
  prod: true,
  // this makes the logs really heavy, but might be useful for queries
  logSQLQueries: ${{LOG_SQL_QUERIES:-false}},
  workers: {
    // if you set this to true, workers will start in the main thread. no need for starting the utils/workers.ts in other tmux tab
    mainThread: ${{USE_WORKERS:-true}},
    low: ${{WORKERS_LOW:-5}},
    medium: ${{WORKERS_MEDIUM:-10}},
    high: ${{WORKERS_HIGH:-100}}
  },
  // this was a dev thing. leave to true unless you are doing stuff in local or your media url is yourinstance/uploads (not recomended)
  removeFolderNameFromFileUploads: true,
  // we use now postgresql.
  databaseConnectionString: 'postgresql://${{POSTGRES_USER}}:${{POSTGRES_PASSWORD}}@${{POSTGRES_HOST}}:${{POSTGRES_PORT}}/${{POSTGRES_DBNAME}}',
  listenIp: '${{LISTEN_IP:-0.0.0.0}}',
  port: ${{PORT:-9000}},
  // In the case of you wantint to put fedi petitions in another thread, use a different port here. You will have to update your apache config
  fediPort: ${{PORT:-9000}},
  // If you want to run the cache routes in another port, same thing!
  cachePort: ${{PORT:-9000}},

  saltRounds: 14,
  // for jwt secret you should use something like https://www.grc.com/passwords.htm please this is SUPER DUPER SECRET.
  jwtSecret: Buffer.from('${{JWT_SECRET}}', 'base64'),
  // https://app.wafrn.net
  frontendUrl: 'https://${{DOMAIN_NAME}}',
  // app.wafrn.net
  instanceUrl: '${{DOMAIN_NAME}}',
  // https://media.wafrn.net
  mediaUrl: '${{FRONTEND_MEDIA_URL}}',
  // You should run also this project github.com/gabboman/fediversemediacacher. In my case, https://cache.wafrn.net/?media= The cache is there because at some point in the past I configured it to precache images. No need for it to be honest
  externalCacheurl: '${{FRONTEND_CACHE_URL}}',
  // If main cache fails due to IP limits you can install additional proxies, and use them here. The cache will try these as well before failing.
  // You can deploy https://github.com/sztupy/did-decoder-lambda this project to Netlify or Vercel as a backup for example
  externalCacheBackups: [${{FRONTEND_CACHE_BACKUP_URLS:-}}],
  // after the first run, create the admin user. and a deleted user. You will have to edit the user url in db so it starts with an @
  adminUser: '${{ADMIN_USER}}',
  // admin email wich you will recive things like "someone registred and you need to review this"
  adminEmail: '${{ADMIN_EMAIL}}',
  adminPassword: '${{ADMIN_PASSWORD}}',
  // after creating the deleted_user we advice to also set the user to BANNED
  deletedUser: '@DELETEDUSER',
  // in MB. Please make sure you have the same in the frontend
  uploadLimit: ${{UPLOAD_LIMIT:-250}},
  // 20 is a good number. With the new query we could investigate a higher number but no need to do it
  postsPerPage: ${{POSTS_PER_PAGE:-20}},
  // trace is extreme logging. debug is ok for now
  logLevel: '${{LOG_LEVEL:-debug}}',
  // There is a script that loads the file from this url and blocks the servers
  blocklistUrl: ${{BLOCKLIST_URI:-''}},
  // In some cases we serve the frontend with the backend with a small preprocessing. We need the location of the frontend
  frontedLocation: '${{FRONTEND_PATH:-/wafrn/packages/frontend}}',
  // oh yes, you need TWO redis connections, one for queues other for cache
  bullmqConnection: {
    host: '${{REDIS_HOST:-localhost}}',
    port: ${{REDIS_PORT:-6379}},
    db: 0
  },
  // second database used for cache
  redisioConnection: {
    host: '${{REDIS_HOST:-localhost}}',
    port: ${{REDIS_PORT:-6379}},
    db: 1
  },
  // this will create a backendlog.log file on the folder superior to this one.
  pinoTransportOptions: {
    targets: [
      {
        target: 'pino/file',
        level: 0,
        options: {
          destination: ${{LOG_DESTINATION:-'logs/backendlog.log'}} // set to 1 to log to stdout
        }
      }
    ]
  },
  // you can try with gmail but we actually use sendinblue for this. bear in mind that this might require some fiddling in your gmail account too
  // you might need to enable https://myaccount.google.com/lesssecureapps
  // https://miracleio.me/snippets/use-gmail-with-nodemailer/
  emailConfig: {
    host: '${{SMTP_HOST:-localhost}}',
    port: ${{SMTP_PORT:-587}},
    auth: {
      user: '${{SMTP_USER}}',
      pass: '${{SMTP_PASSWORD}}',
      from: '${{SMTP_FROM}}'
    }
  },
  // you dont have an smtp server and you want to do a single user instance? set this to true!
  disableRequireSendEmail: ${{DISABLE_REQUIRE_SEND_EMAIL:-false}},
  // if someone is trying to scrap your place you can send a funny message in some petitions (attacks to the frontend)
  blockedIps: ${{BLOCKED_IPS:-[]}} as string[],
  // do you want to manually review registrations or have them open? We advice to leave this one to true
  reviewRegistrations: ${{REVIEW_REGISTRATIONS:-true}},
  // if the blocklist youre using turns out to be biased you can tell the script that loads the block host to do not block these hosts
  ignoreBlockHosts: ${{IGNORE_BLOCK_HOSTS:-[]}} as string[],
  // default SEO data that will be used when trying to load server data
  defaultSEOData: {
    title: '${{DOMAIN_NAME}}',
    description: '${{DOMAIN_NAME}}, a wafrn instance',
    img: 'https://${{DOMAIN_NAME}}/assets/logo.png'
  },
  enableBsky: ${{ENABLE_BSKY:-false}},
  bskyPds: '${{PDS_DOMAIN_NAME}}',
  // to generate these keys use the following command: `npx web-push generate-vapid-keys`. Remember to do the environment one too!!
  webpushPrivateKey: '${{WEBPUSH_PRIVATE}}',
  webpushPublicKey: '${{WEBPUSH_PUBLIC}}',
  // this is a email that will be sent to the distribution services in the users devices in case the owner of the distribution service wants to contact the server that is sending the notifications
  webpushEmail: '${{WEBPUSH_EMAIL}}',
  frontendEnvironment: {
    logo: '${{FRONTEND_LOGO:-/assets/logo.png}}',
    frontUrl: '${{FRONTEND_FQDN_URL}}',
    baseUrl: '${{FRONTEND_API_URL:-/api}}',
    baseMediaUrl: '${{FRONTEND_MEDIA_URL}}',
    externalCacheurl: '${{FRONTEND_CACHE_URL}}',
    shortenPosts: ${{FRONTEND_SHORTEN_POSTS:-3}},
    disablePWA: ${{FRONTEND_DISABLE_PWA:-false}},
    maintenance: ${{FRONTEND_MAINTENANCE:-false}}
  }
}
