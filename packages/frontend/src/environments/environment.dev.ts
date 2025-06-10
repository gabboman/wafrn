// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
//
//
// This is for development options TODO: add jsdocs.
export const environment = {
  production: false,
  maxUploadSize: '250',
  logo: '/assets/logo.png',
  baseUrl: 'http://localhost:3001/api',
  baseMediaUrl: 'http://localhost:3001/api/uploads',
  externalCacheurl: 'https://localhost:3001/api/cache/?media=',
  frontUrl: 'http://localhost:4200',
  shortenPosts: 5,
  reviewRegistrations: true,
  disablePWA: false,
  maintenance: false
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
