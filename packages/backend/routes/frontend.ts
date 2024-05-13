import express, { Application } from 'express'
import { environment } from '../environment'
import { Op } from 'sequelize'
import { Media, Post, User } from '../db'
import fs from 'fs'
import * as DOMPurify from "isomorphic-dompurify";
import { redisCache } from '../utils/redis'


const cacheOptions = {
  etag: false,
  maxAge: '1'
}

export default function frontend(app: Application) {

  const defaultSeoData = environment.defaultSEOData

    // serve default angular application
    app.get(
      [
        '/',
        '/index.html',
        '/index',
        '/blog/*',
        '/dashboard/*',
        '/dashboard',
        '/login',
        '/register',
        '/privacy',
        '/admin/*',
        '/profile/*'
      ],
      function (req, res) {
        res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img), )
      }
    )

    app.get('/post/:id', async function (req, res) {
      if (req.params?.id) {
        try {
          const postData = await getPostSEOCache(req.params.id)
          if (postData) {
            res.send(getIndexSeo(postData.title, postData.description, postData.img))
          } else {
                    res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))

          }
        } catch (error) {
                  res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))

        }
      } else {
                res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))

      }
    })
  
  
  // serve static angular files
  app.get('*.*', express.static(environment.frontedLocation, cacheOptions ))
}

function sanitizeStringForSEO(unsanitized: string): string {
  return DOMPurify.sanitize(unsanitized, {ALLOWED_TAGS: [], }).replaceAll('"', "'")
}



async function getPostSEOCache(id: string) : Promise<{ title: string; description: string; img: string }> {
  const resData = undefined // await redisCache.get('postSeoCache:' + id)
  let res = {... environment.defaultSEOData}
  if (!resData) {
    const post = await Post.findByPk(id, {
      attributes: ['content', 'id'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['url', 'avatar']
        },
        {
          model: Media,
          attributes: ['NSFW', 'url', 'external']
        }
      ]
    })
    if(post) {
      res.title = `${post.user.url.startsWith('@') ? 'External' : 'Wafrn'} post by ${sanitizeStringForSEO(post.user.url)}`.substring(0, 65)
      res.description = (post.content_warning ? `Post has content warning: ${sanitizeStringForSEO(post.content_warning)}` : sanitizeStringForSEO(post.content)).substring(0, 190)
      const safeMedia = post.medias?.find((elem: any) => elem.NSFW === false && !elem.url.toLowerCase().endsWith('mp4'))
      res.img = safeMedia?.url
      redisCache.set('postSeoCache:' + id, JSON.stringify(res), 'EX', 300)
    }
  } else {
    res = JSON.parse(resData)
  }
  return res;
}

function getIndexSeo(title: string, description: string, image?: string) {
  const sanitizedTitle = title.replaceAll('"', "'")
  const sanitizedDescription = description.replaceAll('"', "'").substring(0, 500)
  let imgUrl = '';
  if (image) {
    imgUrl = image.toLowerCase().startsWith('https')
    ? environment.externalCacheurl + encodeURIComponent(image)
    : environment.mediaUrl + image
  }
  let indexWithSeo = fs.readFileSync(`${environment.frontedLocation}/index.html`).toString()
  // index html must have a section with this html comment that we will edit out to put the seo there
  const commentToReplace = /<!-- BEGIN REMOVE THIS IN EXPRESS FOR SEO -->.*(.*(\n))*.*<!-- END REMOVE THIS IN EXPRESS FOR SEO -->/gm
  indexWithSeo = indexWithSeo.replace(
    commentToReplace,
    `
    <meta property="og:title" content="${sanitizedTitle}">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="${sanitizedTitle}">
    <meta property="description" content="${sanitizedDescription}">
    <meta property="og:description" content="${sanitizedDescription}">
    <meta property="twitter:description" content="${sanitizedDescription}">
    ${imgUrl ? `<meta property="og:image" content="${imgUrl}">
    <meta property="twitter:image" content="${imgUrl}">`: ''}
    <meta property="og:site_name" content="${environment.instanceUrl}">
    <meta property="twitter:site" content="${environment.instanceUrl}">
    `
  )

  return indexWithSeo
}