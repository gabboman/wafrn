export const environment = {
  production: true,
  maxUploadSize: '250',
  logo: '/assets/logo.png',
  baseUrl: '/api',
  baseMediaUrl: `${window.location.protocol}${window.location.host}/api/uploads`,
  externalCacheurl: '/api/cache?media=',
  frontUrl: `${window.location.protocol}${window.location.host}`,
  shortenPosts: 3,
  reviewRegistrations: true,
  disablePWA: false,
  maintenance: false,
  maintenanceMessage: ''
}
