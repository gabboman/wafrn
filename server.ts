import 'zone.js/dist/zone-node';

import {
  APP_BASE_HREF
} from '@angular/common';
import {
  ngExpressEngine
} from '@nguniversal/express-engine';
import * as express from 'express';
import {
  existsSync
} from 'fs';
import {
  join
} from 'path';
import 'localstorage-polyfill';
import {
  AppServerModule
} from './src/main.server';
import {
  environment
} from 'src/environments/environment';
import {
  ISRHandler
} from 'ngx-isr';

global['localStorage'] = localStorage;
const domino = require('domino');
const fs = require('fs');
const path = require('path');

// Use the browser index.html as template for the mock window
const template = fs
  .readFileSync(path.join(join(process.cwd(), 'dist/wafrn/browser'), 'index.html'))
  .toString();

// Shim for the global window and document objects.
const window = domino.createWindow(template);
global['window'] = window;
global['document'] = window.document;


// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/wafrn/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';


  const isr = new ISRHandler({
    indexHtml,
    invalidateSecretToken: 'NOT_USED_I_WISH_I_COULD_NOT_SET_THIS_VAR',
    enableLogging: !environment.production
  });
  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/main/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule,
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  // non ssr routes
  server.get(['/dashboard/', '/', '/register', '/recoverPassword'], (req, res) => {
    res.sendFile(distFolder + '/index.html');
  });

  // All regular routes use the Universal engine
  server.get('*',
    // Serve page if it exists in cache
    async (req, res, next) => await isr.serveFromCache(req, res, next),
      // Server side render the page and add to cache if needed
      async (req, res, next) => await isr.render(req, res, next),
  );

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
