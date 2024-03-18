export const environment = {
  production: true, // set this to true
  maxUploadSize: '250', // max upload size in MB
  logo: '/assets/logo.png', // url to the logo image. Must be hosted in the same domain as media
  baseUrl: 'https://mydomain.com/api', // Url for the api
  externalCacheurl: 'https://cache.mydomain/?media=', // this is what will be used to cache external files
  baseMediaUrl: 'https://mydomain/uploads/', // we recomend setting up your own domain that is just media.mydomain.com/
  frontUrl: 'https://mydomain', // the url people will use to access your wafrn instance
  shortenPosts: 5, // at what point should we shorten the posts
  disablePWA: true, // Disable pwa mode. Recomended until you have the headers settings right
};
