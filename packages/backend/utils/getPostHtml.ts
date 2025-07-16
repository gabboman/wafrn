import sanitizeHtml from 'sanitize-html'
import { completeEnvironment } from './backendOptions.js'
import { JSDOM } from 'jsdom'
import { Emoji, Post } from '../models/index.js'

const parser = new new JSDOM('<html></html>').window.DOMParser()
const wafrnMediaRegex =
  /\[wafrnmediaid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm
const youtubeRegex =
  /((?:https?:\/\/)?(www.|m.)?(youtube(\-nocookie)?\.com|youtu\.be)\/(v\/|watch\?v=|embed\/)?([\S]{11}))([^\S]|\?[\S]*|\&[\S]*|\b)/g

function getURL(urlString: string): URL {
  let res = new URL(completeEnvironment.frontendcompleteEnvironment.frontUrl)
  try {
    res = new URL(urlString)
  } catch (error) {
    console.log('Invalid url: ' + urlString)
  }
  return res
}

function emojiToHtml(emoji: Emoji): string {
  return `<img class="post-emoji" src="${
    completeEnvironment.frontendcompleteEnvironment.externalCacheurl +
    (emoji.external
      ? encodeURIComponent(emoji.url)
      : encodeURIComponent(completeEnvironment.frontendcompleteEnvironment.baseMediaUrl + emoji.url))
  }" title="${emoji.name}" alt="${emoji.name}">`
}

export function getPostHtml(
  post: Post,
  tags: string[] = [
    'b',
    'i',
    'u',
    'a',
    's',
    'del',
    'span',
    'br',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'pre',
    'strong',
    'em',
    'ul',
    'li',
    'marquee',
    'font',
    'blockquote',
    'code',
    'hr',
    'ol',
    'q',
    'small',
    'sub',
    'sup',
    'table',
    'tr',
    'td',
    'th',
    'cite',
    'colgroup',
    'col',
    'dl',
    'dt',
    'dd',
    'caption',
    'details',
    'summary',
    'mark',
    'tbody',
    'tfoot',
    'thead'
  ]
): string {
  const content = post.content
  let sanitized = sanitizeHtml(content, {
    allowedTags: tags,
    allowedAttributes: {
      a: ['href', 'title', 'target'],
      col: ['span', 'visibility'],
      colgroup: ['width', 'visibility', 'background', 'border'],
      hr: ['style'],
      span: ['title', 'style', 'lang'],
      th: ['colspan', 'rowspan'],
      '*': ['title', 'lang', 'style']
    },
    allowedStyles: {
      '*': {
        'aspect-ratio': [new RegExp('.*')],
        background: [new RegExp('.*')],
        'background-color': [new RegExp('.*')],
        border: [new RegExp('.*')],
        'border-bottom': [new RegExp('.*')],
        'border-bottom-color': [new RegExp('.*')],
        'border-bottom-left-radius': [new RegExp('.*')],
        'border-bottom-right-radius': [new RegExp('.*')],
        'border-bottom-style': [new RegExp('.*')],
        'border-bottom-width': [new RegExp('.*')],
        'border-collapse': [new RegExp('.*')],
        'border-color': [new RegExp('.*')],
        'border-end-end-radius': [new RegExp('.*')],
        'border-end-start-radius': [new RegExp('.*')],
        'border-inline': [new RegExp('.*')],
        'border-inline-color': [new RegExp('.*')],
        'border-inline-end': [new RegExp('.*')],
        'border-inline-end-color': [new RegExp('.*')],
        'border-inline-end-style': [new RegExp('.*')],
        'border-inline-end-width': [new RegExp('.*')],
        'border-inline-start': [new RegExp('.*')],
        'border-inline-start-color': [new RegExp('.*')],
        'border-inline-start-style': [new RegExp('.*')],
        'border-inline-start-width': [new RegExp('.*')],
        'border-inline-style': [new RegExp('.*')],
        'border-inline-width': [new RegExp('.*')],
        'border-left': [new RegExp('.*')],
        'border-left-color': [new RegExp('.*')],
        'border-left-style': [new RegExp('.*')],
        'border-left-width': [new RegExp('.*')],
        'border-radius': [new RegExp('.*')],
        'border-right': [new RegExp('.*')],
        'border-right-color': [new RegExp('.*')],
        'border-right-style': [new RegExp('.*')],
        'border-right-width': [new RegExp('.*')],
        'border-spacing': [new RegExp('.*')],
        'border-start-end-radius': [new RegExp('.*')],
        'border-start-start-radius': [new RegExp('.*')],
        'border-style': [new RegExp('.*')],
        'border-top': [new RegExp('.*')],
        'border-top-color': [new RegExp('.*')],
        'border-top-left-radius': [new RegExp('.*')],
        'border-top-right-radius': [new RegExp('.*')],
        'border-top-style': [new RegExp('.*')],
        'border-top-width': [new RegExp('.*')],
        'border-width': [new RegExp('.*')],
        bottom: [new RegExp('.*')],
        color: [new RegExp('.*')],
        direction: [new RegExp('.*')],
        'empty-cells': [new RegExp('.*')],
        font: [new RegExp('.*')],
        'font-family': [new RegExp('.*')],
        'font-size': [new RegExp('.*')],
        'font-size-adjust': [new RegExp('.*')],
        'font-style': [new RegExp('.*')],
        'font-variant': [new RegExp('.*')],
        'font-variant-caps': [new RegExp('.*')],
        'font-weight': [new RegExp('.*')],
        height: [new RegExp('.*')],
        'initial-letter': [new RegExp('.*')],
        'inline-size': [new RegExp('.*')],
        left: [new RegExp('.*')],
        'left-spacing': [new RegExp('.*')],
        'list-style': [new RegExp('.*')],
        'list-style-position': [new RegExp('.*')],
        'list-style-type': [new RegExp('.*')],
        margin: [new RegExp('.*')],
        'margin-bottom': [new RegExp('.*')],
        'margin-inline': [new RegExp('.*')],
        'margin-inline-end': [new RegExp('.*')],
        'margin-inline-start': [new RegExp('.*')],
        'margin-left': [new RegExp('.*')],
        'margin-right': [new RegExp('.*')],
        'margin-top': [new RegExp('.*')],
        opacity: [new RegExp('.*')],
        padding: [new RegExp('.*')],
        'padding-bottom': [new RegExp('.*')],
        'padding-inline': [new RegExp('.*')],
        'padding-inline-end': [new RegExp('.*')],
        'padding-inline-right': [new RegExp('.*')],
        'padding-left': [new RegExp('.*')],
        'padding-right': [new RegExp('.*')],
        'padding-top': [new RegExp('.*')],
        quotes: [new RegExp('.*')],
        rotate: [new RegExp('.*')],
        'tab-size': [new RegExp('.*')],
        'table-layout': [new RegExp('.*')],
        'text-align': [new RegExp('.*')],
        'text-align-last': [new RegExp('.*')],
        'text-decoration': [new RegExp('.*')],
        'text-decoration-color': [new RegExp('.*')],
        'text-decoration-line': [new RegExp('.*')],
        'text-decoration-style': [new RegExp('.*')],
        'text-decoration-thickness': [new RegExp('.*')],
        'text-emphasis': [new RegExp('.*')],
        'text-emphasis-color': [new RegExp('.*')],
        'text-emphasis-position': [new RegExp('.*')],
        'text-emphasis-style': [new RegExp('.*')],
        'text-indent': [new RegExp('.*')],
        'text-justify': [new RegExp('.*')],
        'text-orientation': [new RegExp('.*')],
        'text-shadow': [new RegExp('.*')],
        'text-transform': [new RegExp('.*')],
        'text-underline-offset': [new RegExp('.*')],
        'text-underline-position': [new RegExp('.*')],
        top: [new RegExp('.*')],
        transform: [new RegExp('.*')],
        visibility: [new RegExp('.*')],
        width: [new RegExp('.*')],
        'word-break': [new RegExp('.*')],
        'word-spacing': [new RegExp('.*')],
        'word-wrap': [new RegExp('.*')],
        'writing-mode': [new RegExp('.*')]
      }
    }
  })
  // we remove stuff like img and script tags. we only allow certain stuff.
  const parsedAsHTML = parser.parseFromString(sanitized, 'text/html')
  const links = parsedAsHTML.getElementsByTagName('a')
  const mentionedRemoteIds = post.mentionPost ? post.mentionPost?.map((elem) => elem.remoteId) : []
  const mentionRemoteUrls = post.mentionPost ? post.mentionPost?.map((elem) => elem.url) : []
  const mentionedHosts = post.mentionPost
    ? post.mentionPost?.map(
        (elem) => getURL(elem.remoteId ? elem.remoteId : 'https://adomainthatdoesnotexist.google.com').hostname
      )
    : []
  const hostUrl = getURL(completeEnvironment.frontendcompleteEnvironment.frontUrl).hostname
  Array.from(links).forEach((link) => {
    const youtubeMatch = link.href.matchAll(youtubeRegex)
    if (link.innerText === link.href && youtubeMatch) {
      // NOTE: Since this should not be part of the image Viewer, we have to add then no-viewer class to be checked for later
      Array.from(youtubeMatch).forEach((youtubeString) => {
        link.innerHTML = `<div class="watermark"><!-- Watermark container --><div class="watermark__inner"><!-- The watermark --><div class="watermark__body"><img alt="youtube logo" class="yt-watermark no-viewer" loading="lazy" src="/assets/img/youtube_logo.png"></div></div><img class="yt-thumbnail" src="${
          completeEnvironment.frontendcompleteEnvironment.externalCacheurl +
          encodeURIComponent(`https://img.youtube.com/vi/${youtubeString[6]}/hqdefault.jpg`)
        }" loading="lazy" alt="Thumbnail for video"></div>`
      })
    }
    // replace mentioned users with wafrn version of profile.
    // TODO not all software links to mentionedProfile
    if (mentionedRemoteIds.includes(link.href)) {
      if (post.mentionPost) {
        const mentionedUser = post.mentionPost.find((elem) => elem.remoteId === link.href)
        if (mentionedUser) {
          link.href = `${completeEnvironment.frontendcompleteEnvironment.frontUrl}/blog/${mentionedUser.url}`
          link.classList.add('mention')
          link.classList.add('remote-mention')
        }
      }
    }
    const linkAsUrl: URL = getURL(link.href)
    if (mentionedHosts.includes(linkAsUrl.hostname) || linkAsUrl.hostname === hostUrl) {
      const sanitizedContent = sanitizeHtml(link.innerHTML, {
        allowedTags: []
      })
      const isUserTag = sanitizedContent.startsWith('@')
      const isRemoteUser = mentionRemoteUrls.includes(`${sanitizedContent}@${linkAsUrl.hostname}`)
      const isLocalUser = mentionRemoteUrls.includes(`${sanitizedContent}`)
      const isLocalUserLink =
        linkAsUrl.hostname === hostUrl &&
        (linkAsUrl.pathname.startsWith('/blog') || linkAsUrl.pathname.startsWith('/fediverse/blog'))

      if (isUserTag) {
        link.classList.add('mention')

        if (isRemoteUser) {
          // Remote blog, mirror to local blog
          link.href = `/blog/${sanitizedContent}@${linkAsUrl.hostname}`
          link.classList.add('remote-mention')
        }

        if (isLocalUser) {
          //link.href = `/blog/${sanitizedContent}`
          link.classList.add('mention')
          link.classList.add('local-mention')
        }
      }
      // Also tag local user links for user styles
      if (isLocalUserLink) {
        link.classList.add('local-user-link')
      }
    }
    link.target = '_blank'
    sanitized = parsedAsHTML.documentElement.innerHTML
  })

  sanitized = sanitized.replaceAll(wafrnMediaRegex, '')

  let emojiset = new Set<string>()
  post.emojis.forEach((emoji) => {
    // Post can include the same emoji more than once, causing recursive behaviour with alt/title text
    if (emojiset.has(emoji.name)) return
    emojiset.add(emoji.name)
    const strToReplace = emoji.name.startsWith(':') ? emoji.name : `:${emoji.name}:`
    sanitized = sanitized.replaceAll(strToReplace, emojiToHtml(emoji))
  })
  return sanitized
}
