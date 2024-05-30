import express, { Application } from 'express'
import { environment } from '../environment'
import { Op } from 'sequelize'
import { Media, Post, User, sequelize } from '../db'
import fs from 'fs'
import * as DOMPurify from 'isomorphic-dompurify'
import { redisCache } from '../utils/redis'
import { logger } from '../utils/logger'

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
      '/dashboard/*',
      '/dashboard',
      '/login',
      '/register',
      '/privacy',
      '/admin/*',
      '/profile/*'
    ],
    function (req, res) {
      res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
    }
  )

  app.get('/post/:id', async function (req, res) {
    const acceptHeader = req.header('accept') ? req.header('accept') as string : ''
    if (
      acceptHeader.includes('activity+json') ||
      acceptHeader.includes('application/activity+json') ||
      acceptHeader.includes('/ld+json')
    ) {
      const urlToRedirect = environment.frontendUrl + '/fediverse/post/' + req.params?.id
      res.redirect(urlToRedirect)
      res.send()
      return
    }
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

  app.get('/blog/:url', async function (req, res) {
    if (req.params?.url) {
      try {
        const blogData = await getBlogSEOCache(req.params.url)
        if (blogData) {
          res.send(getIndexSeo(blogData.title, blogData.description, blogData.img))
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
  app.get('*.*', express.static(environment.frontedLocation, cacheOptions))
}

function sanitizeStringForSEO(unsanitized: string): string {
  return DOMPurify.sanitize(unsanitized, { ALLOWED_TAGS: [] }).replaceAll('"', "'")
}

async function getPostSEOCache(id: string): Promise<{ title: string; description: string; img: string }> {
  const resData = await redisCache.get('postSeoCache:' + id)
  let res = { ...environment.defaultSEOData }
  if (!resData) {
    const post = await Post.findOne({
      attributes: ['content', 'id', 'privacy', 'content_warning'],
      where: {
        id: id,
        privacy: {
          [Op.in]: [0, 2, 3]
        }
      },
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
    if (post) {
      res.title = `${post.user.url.startsWith('@') ? 'External' : 'Wafrn'} post by ${sanitizeStringForSEO(
        post.user.url
      )}`.substring(0, 65)
      res.description = (
        post.content_warning
          ? `Post has content warning: ${sanitizeStringForSEO(post.content_warning)}`
          : sanitizeStringForSEO(post.content)
      ).substring(0, 190)
      const safeMedia = post.medias?.find((elem: any) => elem.NSFW === false && !elem.url.toLowerCase().endsWith('mp4'))
      res.img = safeMedia?.url
      redisCache.set('postSeoCache:' + id, JSON.stringify(res), 'EX', 300)
    }
  } else {
    res = JSON.parse(resData)
  }
  return res
}

async function getBlogSEOCache(url: string): Promise<{ title: string; description: string; img: string }> {
  const resData = await redisCache.get('blogSeoCache:' + url)
  let res = { ...environment.defaultSEOData }
  if (!resData) {
    const blog = await User.findOne({
      where: {
        url: sequelize.where(sequelize.fn('LOWER', sequelize.col('url')), 'LIKE', url.toLowerCase())
      }
    })
    if (blog) {
      const url = sanitizeStringForSEO(blog.url).substring(0, 65)
      const name = sanitizeStringForSEO(blog.name).substring(0, 65)
      const description = sanitizeStringForSEO(blog.description).substring(0, 200)
      res.title = blog.url.startsWith('@') ? `Blog from external user ${url}` : `@${name}'s wafrn blog`
      res.description = description
      res.img = blog.url.startsWith('@') ? blog.avatar : `${environment.mediaUrl}${blog.avatar}`
      await redisCache.set('blogSeoCache:' + url, JSON.stringify(res), 'EX', 300)
    } else {
      // Given the fact that query can be slow even if the blog does not exist, we should cache the 404
      await redisCache.set('blogSeoCache:' + url, JSON.stringify(res), 'EX', 600)
    }
  } else {
    res = JSON.parse(resData)
  }
  return res
}

function getIndexSeo(title: string, description: string, image?: string) {
  const sanitizedTitle = title.replaceAll('"', "'")
  const sanitizedDescription = description.replaceAll('"', "'").substring(0, 500)
  let imgUrl = ''
  if (image) {
    imgUrl = image.toLowerCase().startsWith('https')
      ? environment.externalCacheurl + encodeURIComponent(image)
      : environment.mediaUrl + image
  }
  let indexWithSeo = fs.readFileSync(`${environment.frontedLocation}/index.html`).toString()
  // index html must have a section with this html comment that we will edit out to put the seo there
  const commentToReplace =
    /<!-- BEGIN REMOVE THIS IN EXPRESS FOR SEO -->.*(.*(\n))*.*<!-- END REMOVE THIS IN EXPRESS FOR SEO -->/gm
  indexWithSeo = indexWithSeo.replace(
    commentToReplace,
    `
    <meta property="og:title" content="${sanitizedTitle}">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="${sanitizedTitle}">
    <meta property="description" content="${sanitizedDescription}">
    <meta property="og:description" content="${sanitizedDescription}">
    <meta property="twitter:description" content="${sanitizedDescription}">
    ${
      imgUrl
        ? `<meta property="og:image" content="${imgUrl}">
    <meta property="twitter:image" content="${imgUrl}">`
        : ''
    }
    <meta property="og:site_name" content="${environment.instanceUrl}">
    <meta property="twitter:site" content="${environment.instanceUrl}">
    `
  )

  return indexWithSeo
}
