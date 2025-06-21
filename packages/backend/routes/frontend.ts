import express, { Application, Response } from 'express'
import { environment } from '../environment.js'
import { Op } from 'sequelize'
import { Emoji, Media, Post, User, sequelize } from '../models/index.js'
import fs from 'fs'
import dompurify from 'isomorphic-dompurify'
import { redisCache } from '../utils/redis.js'
import { getCheckFediverseSignatureFunction } from '../utils/activitypub/checkFediverseSignature.js'
import { SignedRequest } from '../interfaces/fediverse/signedRequest.js'
import { handlePostRequest } from '../utils/activitypub/handlePostRequest.js'
import { Privacy } from '../models/post.js'
import { getPostHtml } from '../utils/getPostHtml.js'
import { logger } from '../utils/logger.js'
import { userInfo } from 'os'

const cacheOptions = {
  etag: false,
  maxAge: '1'
}

function frontend(app: Application) {
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

  app.get('/post/:id', getCheckFediverseSignatureFunction(false), async function (req: SignedRequest, res) {
    //res.redirect(`/fediverse${req.url}`)
    res.send(
      `<script>
        location.replace('/fediverse${req.url}')
      </script>
      <a href="${environment.frontendUrl}/fediverse${req.url}">Hello. Post has been moved here. Please click to go</a>`
    )
  })

  app.get('/blog/:url/ask', async function (req, res) {
    if (req.params?.url) {
      try {
        const blogData = await getBlogSEOCache(req.params.url)
        if (blogData) {
          res.send(getIndexSeo(`Ask anything to ${blogData.title}`, blogData.description, blogData.img))
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
  app.get('/blog/:url/:somethingElse', async function (req, res) {
    res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
  })

  app.get('/blog/:url', async function (req, res) {
    if (req.params?.url) {
      try {
        const blogData = await getBlogSEOCache(req.params.url)
        if (blogData) {
          res.send(
            getIndexSeo(`${blogData.title}'s ${environment.instanceUrl} blog`, blogData.description, blogData.img, blogData.content)
          )
        } else {
          res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
        }
      } catch (error) {
        logger.debug(error);
        res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
      }
    } else {
      res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
    }
  })

  // serve static angular files
  app.get('*.*', express.static(environment.frontedLocation, cacheOptions))

  app.get(
    ['/fediverse/post/:id', '/fediverse/activity/post/:id'],
    getCheckFediverseSignatureFunction(false),
    async (req: SignedRequest, res: Response) => {
      if (req.fediData?.valid) {
        await handlePostRequest(req, res)
      } else {
        const defaultSeoData = environment.defaultSEOData
        if (req.params?.id) {
          try {
            const postData = await getPostSEOCache(req.params.id)
            if (postData) {
              res.send(getIndexSeo(postData.title, postData.description, postData.img, postData.content))
            } else {
              res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
            }
          } catch (error) {
            logger.debug(error);
            res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
          }
        } else {
          res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
        }
      }
    }
  )
}

function sanitizeStringForSEO(unsanitized: string): string {
  return dompurify.sanitize(unsanitized, { ALLOWED_TAGS: [] }).replaceAll('"', "'")
}

function getPostMicroformat(post: Post, includeBlog: boolean = false, mainImage?: string): string {
  const skipImage: Array<boolean> = [];
  let sanitizedHtml = getPostHtml(post)

  sanitizedHtml = sanitizedHtml.replaceAll(/!\[media-(\d+)\]/g, (_, p1) => { if (post.medias?.[p1 - 1]) { skipImage[p1 - 1] = true; const media = post.medias[p1 - 1]; return `<img class="${mainImage == media.fullUrl ? 'u-photo' : ''}" style="max-width:100%" title="${sanitizeStringForSEO(media.description)}" src="${media.fullUrl}">` } else return ''; })

  return `<div style="max-width:100%" class="h-entry">
        ${includeBlog ? `<div class="p-author">
          ${getBlogMicroformat(post.user)}
        </div>` : ''}
        <a class="u-url u-uid" href="${post.fullUrl}"><time class="dt-published" datetime="${post.createdAt.toISOString()}">${post.createdAt.toLocaleString()}</time></a>
        ${(post.parent) ? `<a class="u-in-reply-to" href="${post.parent.fullUrl}">In Reply To</a>` : ''}
        ${post.content_warning ? `<div class="p-summary">${sanitizeStringForSEO(post.content_warning)}</div>` : ''}
        <div class="e-content">
        ${sanitizedHtml}
        ${post.medias?.filter((_, idx) => !skipImage[idx])?.map((elem) => `<img class="${mainImage == elem.fullUrl ? 'u-photo' : ''}" style="max-width:100%" title="${sanitizeStringForSEO(elem.description)}" src="${elem.fullUrl}">`).join("\n") || ''}
        </div>
      </div>`;
}

function getBlogMicroformat(user: User): string {
  return `<div style="max-width:100%" class="h-card">
            <a class="p-name u-url" rel="me" href="${user.fullUrl}">${sanitizeStringForSEO(user.name)}</a>
            ${user.avatar ? `<img style="max-width:100%" class="u-photo" src="${user.avatarFullUrl}" />` : ''}
            ${user.headerImage ? `<img style="max-width:100%" class="u-featured" src="${user.headerImageFullUrl}" />` : ''}
          </div>`;
}

const postSearchAttributes = function (id?: string) {
  const result: any = {
    attributes: ['content', 'id', 'privacy', 'content_warning', 'createdAt'],
    where: {
      privacy: {
        [Op.in]: [Privacy.Public, Privacy.LocalOnly, Privacy.Unlisted]
      },
      isDeleted: false,
      isReblog: false
    },
    include: [
      {
        model: Post,
        as: 'parent',
        attributes: ['id', 'remotePostId']
      },
      {
        model: User,
        as: 'user',
        attributes: ['url', 'name', 'avatar', 'headerImage']
      },
      {
        model: Media,
        attributes: ['NSFW', 'url', 'external', 'description']
      },
      {
        model: Emoji,
        attributes: ['name', 'url']
      }
    ]
  }

  if (id) result.where.id = id;

  return result;
}

async function getPostSEOCache(id: string): Promise<{ title: string; description: string; img: string, content?: string }> {
  const resData = await redisCache.get('postSeoCache:' + id)
  let res: any = { ...environment.defaultSEOData }
  if (!resData) {
    const post = await Post.findOne(postSearchAttributes(id))
    if (post && post.user) {
      res.title = `${post.user.url.startsWith('@') ? 'External' : 'Wafrn'} post by ${sanitizeStringForSEO(
        post.user.url
      )}`.substring(0, 65)
      res.description = (
        post.content_warning
          ? `Post has content warning: ${sanitizeStringForSEO(post.content_warning)}`
          : sanitizeStringForSEO(post.content)
      ).substring(0, 190)
      const safeMedia = post.medias?.find((elem: any) => elem.NSFW === false && !elem.url.toLowerCase().endsWith('mp4'))
      if (safeMedia)
        res.img = safeMedia?.fullUrl

      res.content = getPostMicroformat(post, true, res.img);

      redisCache.set('postSeoCache:' + id, JSON.stringify(res), 'EX', 300)
    }
  } else {
    res = JSON.parse(resData)
  }
  return res
}

async function getBlogSEOCache(url: string): Promise<{ title: string; description: string; img: string, content: string }> {
  const resData = await redisCache.get('blogSeoCache:' + url)
  let res: any = { ...environment.defaultSEOData }
  if (!resData) {
    const blog = await User.findOne({
      where: sequelize.and(
        sequelize.where(sequelize.fn('lower', sequelize.col('url')), url.toLowerCase()),
        sequelize.where(sequelize.col('email'), Op.ne, null)
      )
    })
    if (blog) {
      const url = sanitizeStringForSEO(blog.url).substring(0, 65)
      const name = sanitizeStringForSEO(blog.name).substring(0, 65)
      const description = sanitizeStringForSEO(blog.description).substring(0, 200)
      res.title = name
      res.description = description
      res.img = blog.url.startsWith('@') ? blog.avatar : `${environment.mediaUrl}${blog.avatar}`

      res.content = getBlogMicroformat(blog)

      const posts = await blog.getPosts({
        order: [['createdAt', 'DESC']],
        limit: 10,
        ...postSearchAttributes()
      });

      if (posts.length > 0) {
        res.content += `<div class="h-feed">
          ${posts.map(post => getPostMicroformat(post, false)).join('\n')}
        </div>`
      }

      if (blog) await redisCache.set('blogSeoCache:' + url, JSON.stringify(res), 'EX', 300)
    } else {
      // Given the fact that query can be slow even if the blog does not exist, we should cache the 404
      await redisCache.set('blogSeoCache:' + url, JSON.stringify(res), 'EX', 600)
    }
  } else {
    res = JSON.parse(resData)
  }
  return res
}

function getIndexSeo(title: string, description: string, image?: string, content?: string) {
  const sanitizedTitle = title.replaceAll('"', "'")
  const sanitizedDescription = description.replaceAll('"', "'").substring(0, 500)
  let imgUrl = ''
  if (image) {
    imgUrl = image.toLowerCase().startsWith('https') ? image : environment.mediaUrl + image
  }
  imgUrl = sanitizeStringForSEO(imgUrl)
  let indexWithSeo = fs.readFileSync(`${environment.frontedLocation}/index.html`).toString()
  // index html must have a section with this html comment that we will edit out to put the seo there
  const commentToReplace =
    /<!-- BEGIN REMOVE THIS IN EXPRESS FOR SEO -->.*(.*(\n))*.*<!-- END REMOVE THIS IN EXPRESS FOR SEO -->/gm
  indexWithSeo = indexWithSeo.replace(
    commentToReplace,
    `
     <meta property="og:site_name" content="${environment.instanceUrl}" />
    <meta property="og:title" content="${sanitizedTitle}">
    <meta name="twitter:title" content="${sanitizedTitle}">
    <meta property="description" content="${sanitizedDescription}">
    <meta property="og:description" content="${sanitizedDescription}">
    <meta name="twitter:description" content="${sanitizedDescription}">
    ${
      imgUrl
        ? `<meta property="og:image" content="${imgUrl}">
    <meta name="twitter:image" content="${imgUrl}">`
        : ''
    }
    <meta property="og:site_name" content="${environment.instanceUrl}">
    <meta name="twitter:site" content="${environment.instanceUrl}">
    `
  )

  const bodyCommendToReplace =
    /<!-- BEGIN MAIN CONTENT FOR INDIEWEB -->.*(.*(\n))*.*<!-- END MAIN CONTENT FOR INDIEWEB -->/gm

  indexWithSeo = indexWithSeo.replace(bodyCommendToReplace, (content || ''));

  return indexWithSeo
}

export { frontend, getIndexSeo, getPostSEOCache, getBlogSEOCache }
