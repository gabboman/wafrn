import { Op } from 'sequelize'
import { FederatedHost, User } from '../../db'
import { environment } from '../../environment'
import { postToJSONLD } from './postToJSONLD'
import { LdSignature } from './rsa2017'
import _ from 'underscore'
import { Queue } from 'bullmq'

const sendPostQueue = new Queue('sendPostToInboxes', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: 25000
  }
})
async function federatePostHasBeenEdited(postToEdit: any) {
  return
  const user = await User.findByPk(postToEdit.userId)

  const postAsJSONLD = await postToJSONLD(postToEdit)
  const objectToSend = {
    '@context': [`${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
    actor: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
    to: postAsJSONLD.to,
    cc: postAsJSONLD.cc,
    published: new Date().toString(),
    id: `${environment.frontendUrl}/fediverse/post/${postToEdit.id}/update/${new Date().getTime()}`,
    object: {
      actor: postAsJSONLD.actor,
      attachment: [],
      attributedTo: 'https://akkoma.dev.wafrn.net/users/gabboman',
      cc: ['https://akkoma.dev.wafrn.net/users/gabboman/followers'],
      content: 'testingtttggg',
      contentMap: { en: 'testingtttggg' },
      context: 'https://akkoma.dev.wafrn.net/contexts/4bccba1e-11c4-4570-93f1-d505ac917b30',
      conversation: 'https://akkoma.dev.wafrn.net/contexts/4bccba1e-11c4-4570-93f1-d505ac917b30',
      /*"formerRepresentations": {
        "orderedItems": [
          {
            "actor": "https://akkoma.dev.wafrn.net/users/gabboman",
            "attachment": [],
            "attributedTo": "https://akkoma.dev.wafrn.net/users/gabboman",
            "cc": ["https://akkoma.dev.wafrn.net/users/gabboman/followers"],
            "content": "testingttt",
            "contentMap": { "en": "testingttt" },
            "context": "https://akkoma.dev.wafrn.net/contexts/4bccba1e-11c4-4570-93f1-d505ac917b30",
            "conversation": "https://akkoma.dev.wafrn.net/contexts/4bccba1e-11c4-4570-93f1-d505ac917b30",
            "published": "2024-02-25T23:31:05.550628Z",
            "source": { "content": "testingttt", "mediaType": "text/plain" },
            "summary": "",
            "tag": [],
            "to": ["https://www.w3.org/ns/activitystreams#Public"],
            "type": "Note",
            "updated": "2024-02-26T19:24:58.568615Z"
          },
          {
            "actor": "https://akkoma.dev.wafrn.net/users/gabboman",
            "attachment": [],
            "attributedTo": "https://akkoma.dev.wafrn.net/users/gabboman",
            "cc": ["https://akkoma.dev.wafrn.net/users/gabboman/followers"],
            "content": "testing",
            "contentMap": { "en": "testing" },
            "context": "https://akkoma.dev.wafrn.net/contexts/4bccba1e-11c4-4570-93f1-d505ac917b30",
            "conversation": "https://akkoma.dev.wafrn.net/contexts/4bccba1e-11c4-4570-93f1-d505ac917b30",
            "published": "2024-02-25T23:31:05.550628Z",
            "source": { "content": "testing", "mediaType": "text/plain" },
            "summary": "",
            "tag": [],
            "to": ["https://www.w3.org/ns/activitystreams#Public"],
            "type": "Note",
            "updated": "2024-02-25T23:31:22.105545Z"
          },
          {
            "actor": "https://akkoma.dev.wafrn.net/users/gabboman",
            "attachment": [],
            "attributedTo": "https://akkoma.dev.wafrn.net/users/gabboman",
            "cc": ["https://akkoma.dev.wafrn.net/users/gabboman/followers"],
            "content": "test",
            "contentMap": { "en": "test" },
            "context": "https://akkoma.dev.wafrn.net/contexts/4bccba1e-11c4-4570-93f1-d505ac917b30",
            "conversation": "https://akkoma.dev.wafrn.net/contexts/4bccba1e-11c4-4570-93f1-d505ac917b30",
            "published": "2024-02-25T23:31:05.550628Z",
            "source": { "content": "test", "mediaType": "text/plain" },
            "summary": "",
            "tag": [],
            "to": ["https://www.w3.org/ns/activitystreams#Public"],
            "type": "Note"
          }
        ],
        "totalItems": 3,
        "type": "OrderedCollection"
      },*/
      id: 'https://akkoma.dev.wafrn.net/objects/f8455914-579e-4a34-b74b-efa8e7d579fe',
      published: '2024-02-25T23:31:05.550628Z',
      source: { content: 'testingtttggg', mediaType: 'text/plain' },
      summary: '',
      tag: [],
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      type: 'Note',
      updated: '2024-02-26T19:25:25.066768Z'
    },
    type: 'Update'
  }

  let serversToSendThePost =
    postToEdit.privacy === 10
      ? []
      : FederatedHost.findAll({
          where: {
            publicInbox: { [Op.ne]: null },
            blocked: false
          }
        })
  let usersToSendThePost =
    postToEdit.privacy === 10
      ? []
      : FederatedHost.findAll({
          where: {
            publicInbox: { [Op.eq]: null },
            blocked: false
          },
          include: [
            {
              model: User,
              attributes: ['remoteInbox'],
              where: {
                banned: false
              }
            }
          ]
        })
  let mentionedUsers = User.findAll({
    attributes: ['remoteInbox'],
    where: {
      federatedHostId: { [Op.ne]: null },
      id: {
        [Op.in]: (await postToEdit.getMentionPost()).map((usr: any) => usr.id)
      }
    }
  })
  await Promise.all([serversToSendThePost, usersToSendThePost, mentionedUsers])
  serversToSendThePost = await serversToSendThePost
  usersToSendThePost = await usersToSendThePost
  mentionedUsers = await mentionedUsers
  let urlsToSendPost = []
  if (mentionedUsers) {
    urlsToSendPost = mentionedUsers.map((mention: any) => mention.remoteInbox)
  }
  if (serversToSendThePost) {
    urlsToSendPost = urlsToSendPost.concat(serversToSendThePost.map((server: any) => server.publicInbox))
  }
  if (usersToSendThePost) {
    urlsToSendPost = urlsToSendPost.concat(usersToSendThePost.map((usr: any) => usr.remoteInbox))
  }

  const ldSignature = new LdSignature()
  const bodySignature = await ldSignature.signRsaSignature2017(
    objectToSend,
    user.privateKey,
    `${environment.frontendUrl}/fediverse/blog/${user.url.toLocaleLowerCase()}`,
    environment.instanceUrl,
    new Date()
  )
  for await (const inboxChunk of _.chunk(urlsToSendPost, 50)) {
    await sendPostQueue.add(
      'sencChunk',
      {
        objectToSend: { ...objectToSend, signature: bodySignature.signature },
        petitionBy: user.dataValues,
        inboxList: inboxChunk
      },
      {
        priority: 500
      }
    )
  }
}

export { federatePostHasBeenEdited }
