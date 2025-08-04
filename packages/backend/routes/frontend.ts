import express, { Request, Application, Response } from 'express'
import { Op } from 'sequelize'
import { Emoji, FederatedHost, Media, Post, User, UserOptions, sequelize } from '../models/index.js'
import fs from 'fs'
import dompurify from 'isomorphic-dompurify'
import { redisCache } from '../utils/redis.js'
import { getCheckFediverseSignatureFunction } from '../utils/activitypub/checkFediverseSignature.js'
import { SignedRequest } from '../interfaces/fediverse/signedRequest.js'
import { handlePostRequest } from '../utils/activitypub/handlePostRequest.js'
import { Privacy } from '../models/post.js'
import { getPostHtml } from '../utils/getPostHtml.js'
import { logger } from '../utils/logger.js'
import { Feed } from 'feed'
import { completeEnvironment } from '../utils/backendOptions.js'
import { getallBlockedServers } from '../utils/cacheGetters/getAllBlockedServers.js'

const cacheOptions = {
  etag: false,
  maxAge: '1'
}

function frontend(app: Application) {
  const defaultSeoData = completeEnvironment.defaultSEOData

  app.get('/api/disableEmailNotifications/:id/:code', async (req: Request, res: Response) => {
    let result = false
    let userId = req.params.id
    let code = req.params.code
    if (userId && code) {
      let user = await User.findByPk(userId)
      if (user && user.activationCode == code) {
        user.disableEmailNotifications = true
        await user.save()
        result = true
      }
    }
    res.send(
      result
        ? `You successfuly disabled email notifications`
        : `Something went wrong! Please do send an email to the instance admin! Do reply to the email`
    )
  })

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
      <a href="${completeEnvironment.frontendUrl}/fediverse${req.url}">Hello. Post has been moved here. Please click to go</a>`
    )
  })

  // RSS
  app.get('/blog/:url/rss', async (req: Request, res: Response) => {
    let result: { status: 404 | 200; data: any } = {
      status: 404,
      data: undefined
    }
    if (req.params?.url) {
      const url = req.params.url
      let cacheResult = await redisCache.get('blogRss:' + url)
      if (cacheResult) {
        res.contentType('application/rss+xml')
        return res.send(cacheResult)
      }
      const blog = await User.findOne({
        where: sequelize.and(
          sequelize.where(sequelize.fn('lower', sequelize.col('url')), url.toLowerCase()),
          sequelize.where(sequelize.col('email'), Op.ne, null)
        )
      })
      if (blog) {
        const feed = new Feed({
          title: sanitizeStringForSEO(`${blog.url}'s wafrn blog`),
          description: sanitizeStringForSEO(blog.description),
          id: `${completeEnvironment.frontendUrl}/blog/${blog.url}/rss`,
          link: `${completeEnvironment.frontendUrl}/blog/${blog.url}`,
          image: `${completeEnvironment.mediaUrl}${blog.avatar}`,
          favicon: `${completeEnvironment.frontendUrl}/favicon.ico`,
          copyright:
            'All rights reserved by the user. The content of this blog shall not be used for LLM training data unless stated otherwise in here',
          generator: completeEnvironment.instanceUrl,
          author: {
            name: blog.name,
            link: `${completeEnvironment.frontendUrl}/blog/${blog.url}`
          }
        })
        const rssOption = await UserOptions.findOne({
          where: {
            userId: blog.id,
            optionName: 'wafrn.enableRSS'
          }
        })
        let posts: Post[] = []
        if (rssOption && rssOption.optionValue != '0') {
          // value 0: NO
          // value 1: Only articles
          // value 2: ALL
          posts = await blog.getPosts({
            order: [['createdAt', 'DESC']],
            limit: 10,
            ...(await postSearchAttributes({ onlyArticles: rssOption.optionValue == '1' }))
          })
        }
        posts = posts.reverse()
        posts.forEach((post) => {
          feed.addItem({
            title: sanitizeStringForSEO(post.title ? post.title : `Wafrn post by ${blog.url}`),
            id: post.id,
            link: `${completeEnvironment.frontendUrl}/fediverse/post/${post.id}`,
            description: sanitizeStringForSEO(post.content.substring(0, 150)),
            content: getPostMicroformat(post, false),
            date: post.createdAt
            // image: post.image
          })
        })
        let dataToCache = feed.rss2()
        await redisCache.set('blogRss:' + url, dataToCache, 'EX', 300)
        result = { status: 200, data: dataToCache }
      }
    }
    res.status(result.status)
    if (result.data) {
      res.contentType('application/rss+xml')
      res.send(result.data)
    } else {
      res.send()
    }
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
            getIndexSeo(
              `${blogData.title}'s ${completeEnvironment.instanceUrl} blog`,
              blogData.description,
              blogData.img,
              blogData.content
            )
          )
        } else {
          res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
        }
      } catch (error) {
        logger.debug(error)
        res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
      }
    } else {
      res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
    }
  })

  app.get(
    ['/fediverse/post/:id', '/fediverse/activity/post/:id'],
    getCheckFediverseSignatureFunction(false),
    async (req: SignedRequest, res: Response) => {
      if (req.fediData?.valid) {
        await handlePostRequest(req, res)
      } else {
        const defaultSeoData = completeEnvironment.defaultSEOData
        if (req.params?.id) {
          try {
            const postData = await getPostSEOCache(req.params.id)
            if (postData) {
              res.send(getIndexSeo(postData.title, postData.description, postData.img, postData.content))
            } else {
              res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
            }
          } catch (error) {
            logger.debug(error)
            res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
          }
        } else {
          res.send(getIndexSeo(defaultSeoData.title, defaultSeoData.description, defaultSeoData.img))
        }
      }
    }
  )
  // serve static angular files
  app.get('*.*', express.static(completeEnvironment.frontedLocation, cacheOptions))
}

function sanitizeStringForSEO(unsanitized: string): string {
  return dompurify.sanitize(unsanitized, { ALLOWED_TAGS: [] }).replaceAll('"', "'")
}

function getPostMicroformat(post: Post, includeBlog: boolean = false, mainImage?: string): string {
  const skipImage: Array<boolean> = []
  let sanitizedHtml = getPostHtml(post)

  sanitizedHtml = sanitizedHtml.replaceAll(/!\[media-(\d+)\]/g, (_, p1) => {
    if (post.medias?.[p1 - 1]) {
      skipImage[p1 - 1] = true
      const media = post.medias[p1 - 1]
      return `<img class="${
        mainImage == media.fullUrl ? 'u-photo' : ''
      }" style="max-width:100%" title="${sanitizeStringForSEO(media.description)}" src="${media.fullUrl}">`
    } else return ''
  })

  return `<div style="max-width:100%" class="h-entry">
        ${
          includeBlog
            ? `<div class="p-author">
          ${getBlogMicroformat(post.user)}
        </div>`
            : ''
        }
        <a class="u-url u-uid" href="${
          post.fullUrl
        }"><time class="dt-published" datetime="${post.createdAt.toISOString()}">${post.createdAt.toLocaleString()}</time></a>
        ${post.parent ? `<a class="u-in-reply-to" href="${post.parent.fullUrl}">In Reply To</a>` : ''}
        ${post.content_warning ? `<div class="p-summary">${sanitizeStringForSEO(post.content_warning)}</div>` : ''}
        <div class="e-content">
        ${sanitizedHtml}
        ${
          post.medias
            ?.filter((_, idx) => !skipImage[idx])
            ?.map(
              (elem) =>
                `<img class="${
                  mainImage == elem.fullUrl ? 'u-photo' : ''
                }" style="max-width:100%" title="${sanitizeStringForSEO(elem.description)}" src="${elem.fullUrl}">`
            )
            .join('\n') || ''
        }
        </div>
      </div>`
}

function getBlogMicroformat(user: User): string {
  return `<div style="max-width:100%" class="h-card">
            <a class="p-name u-url" rel="me" href="${user.fullUrl}">${sanitizeStringForSEO(user.name)}</a>
            ${user.avatar ? `<img style="max-width:100%" class="u-photo" src="${user.avatarFullUrl}" />` : ''}
            ${
              user.headerImage
                ? `<img style="max-width:100%" class="u-featured" src="${user.headerImageFullUrl}" />`
                : ''
            }
          </div>`
}

const postSearchAttributes = async function (options?: { id?: string; onlyArticles?: boolean }) {
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
        required: true,
        where: {
          hideProfileNotLoggedIn: {
            [Op.ne]: true
          },
          banned: {
            [Op.ne]: true
          },
          [Op.or]: [
            {
              federatedHostId: {
                [Op.notIn]: await getallBlockedServers()
              }
            },
            {
              federatedHostId: null
            }
          ]
        },
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

  if (options?.id) result.where.id = options.id

  return result
}

async function getPostSEOCache(
  id: string
): Promise<{ title: string; description: string; img: string; content?: string }> {
  const resData = await redisCache.get('postSeoCache:' + id)
  let res: any = { ...completeEnvironment.defaultSEOData }
  if (!resData) {
    const post = await Post.findOne(await postSearchAttributes({ id }))
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
      if (safeMedia) {
        res.img = safeMedia?.fullUrl
      }
      res.content = getPostMicroformat(post, true, res.img)

      redisCache.set('postSeoCache:' + id, JSON.stringify(res), 'EX', 300)
    }
  } else {
    res = JSON.parse(resData)
  }
  return res
}

async function getBlogSEOCache(
  url: string
): Promise<{ title: string; description: string; img: string; content: string }> {
  const resData = await redisCache.get('blogSeoCache:' + url)
  let res: any = { ...completeEnvironment.defaultSEOData }
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
      res.img = blog.url.startsWith('@') ? blog.avatar : `${completeEnvironment.mediaUrl}${blog.avatar}`

      res.content = getBlogMicroformat(blog)
      const rssOption = await UserOptions.findOne({
        where: {
          userId: blog.id,
          optionName: 'wafrn.enableRSS'
        }
      })
      let posts: Post[] = []
      if (rssOption && rssOption.optionValue != '0') {
        // value 0: NO
        // value 1: Only articles
        // value 2: ALL
        posts = await blog.getPosts({
          order: [['createdAt', 'DESC']],
          limit: 10,
          ...(await postSearchAttributes({ onlyArticles: rssOption.optionValue == '1' }))
        })
      }

      if (posts.length > 0) {
        res.content += `<div class="h-feed">
          ${posts.map((post) => getPostMicroformat(post, false)).join('\n')}
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
    imgUrl = image.toLowerCase().startsWith('https') ? image : completeEnvironment.mediaUrl + image
  }
  imgUrl = sanitizeStringForSEO(imgUrl)
  let indexWithSeo = fs.readFileSync(`${completeEnvironment.frontedLocation}/index.html`).toString()
  // index html must have a section with this html comment that we will edit out to put the seo there
  const commentToReplace =
    /<!-- BEGIN REMOVE THIS IN EXPRESS FOR SEO -->.*(.*(\n))*.*<!-- END REMOVE THIS IN EXPRESS FOR SEO -->/gm
  indexWithSeo = indexWithSeo.replace(
    commentToReplace,
    `
     <meta property="og:site_name" content="${completeEnvironment.instanceUrl}" />
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
    <meta property="og:site_name" content="${completeEnvironment.instanceUrl}">
    <meta name="twitter:site" content="${completeEnvironment.instanceUrl}">
    `
  )

  const bodyCommendToReplace =
    /<!-- BEGIN MAIN CONTENT FOR INDIEWEB -->.*(.*(\n))*.*<!-- END MAIN CONTENT FOR INDIEWEB -->/gm

  indexWithSeo = indexWithSeo.replace(bodyCommendToReplace, content || '')

  return indexWithSeo
}

export { frontend, getIndexSeo, getPostSEOCache, getBlogSEOCache }
