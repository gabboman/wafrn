import 'zone.js/dist/zone-node'

import { APP_BASE_HREF } from '@angular/common'
import { ngExpressEngine } from '@nguniversal/express-engine'
import * as express from 'express'
import { existsSync } from 'fs'
import { join } from 'path'
import 'localstorage-polyfill'
import { AppServerModule } from './src/main.server'
import { environment } from 'src/environments/environment'

global['localStorage'] = localStorage
const domino = require('domino')
const fs = require('fs')
const path = require('path')
const cache = require('memory-cache')

// Use the browser index.html as template for the mock window
const template = fs.readFileSync(path.join(join(process.cwd(), 'dist/wafrn/browser'), 'index.html')).toString()

// Shim for the global window and document objects.
const window = domino.createWindow(template)
global['window'] = window
global['document'] = window.document

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express()
  const distFolder = join(process.cwd(), 'dist/wafrn/browser')
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index'

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/main/modules/express-engine)
  server.engine(
    'html',
    ngExpressEngine({
      bootstrap: AppServerModule
    })
  )

  server.set('view engine', 'html')
  server.set('views', distFolder)

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(distFolder))

  // non ssr routes
  server.get('*', (req, res) => {
    //server.get(['/dashboard/', '/dashboard/explore', '/dashboard/exploreLocal', '/', '/register', '/recoverPassword'], (req, res) => {
    res.sendFile(`${distFolder}/index.html`)
  })

  // All regular routes that use the Universal engine
  server.get(
    '*',
    (req, res, next) => {
      // we check if the page we want to render has been cached
      if (cache.get(req.url)) {
        res.send(cache.get(req.url))
      } else {
        next()
      }
    },
    (req, res) => {
      // if it has not been cached, we render it and we add it to cache
      res.render(
        indexHtml,
        {
          req,
          providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }]
        },
        (err: Error, html: string) => {
          // Cache the rendered `html` for this request url to use for subsequent requests. No time limit on cache
          cache.put(req.url, html)
          res.send(html)
        }
      )
    }
  )

  return server
}

function run(): void {
  const port = process.env['PORT'] || 4000

  // Start up the Node server
  const server = app()
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`)
  })
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire
const mainModule = __non_webpack_require__.main
const moduleFilename = mainModule?.filename || ''
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run()
}

export * from './src/main.server'
