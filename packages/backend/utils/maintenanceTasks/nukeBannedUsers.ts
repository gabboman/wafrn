import { Op } from 'sequelize'
import {
  Blocks,
  EmojiReaction,
  FederatedHost,
  Follows,
  Notification,
  Post,
  PostMentionsUserRelation,
  PostReport,
  User,
  UserBookmarkedPosts,
  UserEmojiRelation,
  UserFollowHashtags,
  UserLikesPostRelations
} from '../../models/index.js'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'
import { completeEnvironment } from '../backendOptions.js'
import { Queue } from 'bullmq'
import { LdSignature } from '../activitypub/rsa2017.js'
import { getDeletedUser } from '../cacheGetters/getDeletedUser.js'

const deletePostQueue = new Queue('deletePostQueue', {
  connection: completeEnvironment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: true
  }
})

const users = await User.findAll({
  where: {
    banned: true,
    id: {
      [Op.ne]: ((await getDeletedUser()) as User).id
    },
    email: {
      [Op.ne]: null
    }
  }
})

const usersToNukeIds = users.map((elem) => elem.id)

// if users, we prepare

if (users.length > 0) {
  // nuke hashtags
  console.log(`--- nuking subscribed hashtags---`)
  await UserFollowHashtags.destroy({
    where: {
      userId: {
        [Op.in]: usersToNukeIds
      }
    }
  })
  console.log(`---- deleting inactive users: ${users.length}----`)
  console.log(`Obtainign list of all fedi inboxes`)
  const serversToSendThePost = await FederatedHost.findAll({
    where: {
      publicInbox: { [Op.ne]: null }
    }
  })
  const usersToSendThePostHost = await FederatedHost.findAll({
    where: {
      publicInbox: { [Op.eq]: null }
    },
    include: [
      {
        model: User,
        attributes: ['remoteInbox'],
        where: {
          remoteInbox: { [Op.ne]: null }
        }
      }
    ]
  })
  const usersToSendThePost = usersToSendThePostHost.flatMap((elem: any) => elem.users)

  const inboxes = serversToSendThePost
    .map((elem) => elem.publicInbox)
    .concat(usersToSendThePost.map((usr) => usr.remoteInbox))
    .filter((elem) => elem != null)

  console.log(`----List obtained----`)

  // we delete likes, emojireacts, mentions, notifications, follows, blocks and bookmarks
  console.log('Deleting likes...')
  await UserLikesPostRelations.destroy({
    where: {
      userId: {
        [Op.in]: usersToNukeIds
      }
    }
  })

  console.log('Deleting emojireacts')
  await UserEmojiRelation.destroy({
    where: {
      userId: {
        [Op.in]: usersToNukeIds
      }
    }
  })
  await EmojiReaction.destroy({
    where: {
      userId: {
        [Op.in]: usersToNukeIds
      }
    }
  })
  console.log('Deleting mentions')
  await PostMentionsUserRelation.destroy({
    where: {
      userId: {
        [Op.in]: usersToNukeIds
      }
    }
  })

  console.log('Deleting bookmarks')
  await UserBookmarkedPosts.destroy({
    where: {
      userId: {
        [Op.in]: usersToNukeIds
      }
    }
  })

  console.log('Deleting notifications')
  await Notification.destroy({
    where: {
      [Op.or]: [
        {
          notifiedUserId: {
            [Op.in]: usersToNukeIds
          }
        },
        {
          userId: {
            [Op.in]: usersToNukeIds
          }
        }
      ]
    }
  })

  console.log('Deleting follows')
  await Follows.destroy({
    where: {
      [Op.or]: [
        {
          followedId: {
            [Op.in]: usersToNukeIds
          }
        },
        {
          followerId: {
            [Op.in]: usersToNukeIds
          }
        }
      ]
    }
  })

  console.log('Deleting Blocks')
  await Blocks.destroy({
    where: {
      [Op.or]: [
        {
          blockedId: {
            [Op.in]: usersToNukeIds
          }
        },
        {
          blockerId: {
            [Op.in]: usersToNukeIds
          }
        }
      ]
    }
  })

  console.log('Deleting Reports')
  await PostReport.destroy({
    where: {
      [Op.or]: [
        {
          userId: {
            [Op.in]: usersToNukeIds
          }
        },
        {
          reportedUserId: {
            [Op.in]: usersToNukeIds
          }
        }
      ]
    }
  })

  console.log('--- Nuking posts ---')
  const updatePosts = Post.update(
    {
      userId: ((await getDeletedUser()) as User).id
    },
    {
      where: {
        userId: {
          [Op.in]: usersToNukeIds
        }
      }
    }
  ).then(async (editedData) => {
    console.log(`--- Nuking posts Completed ---`)
    console.log(editedData)
    await User.destroy({
      where: {
        id: {
          [Op.in]: usersToNukeIds
        }
      }
    })
  })
  console.log('--- starting sending deletions to everyone ---')
  for await (const user of users) {
    console.log(`Preparing queue of mass delete for ${user.url}`)
    const objectToSend: activityPubObject = {
      '@context': [`${completeEnvironment.frontendUrl}/contexts/litepub-0.1.jsonld`],
      actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
      id: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}#deleteUser`,
      object: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
      type: 'Delete'
    }
    const ldSignature = new LdSignature()
    const bodySignature = await ldSignature.signRsaSignature2017(
      objectToSend,
      user.privateKey as string,
      `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLocaleLowerCase()}`,
      completeEnvironment.instanceUrl,
      new Date()
    )
    for await (const inboxChunk of inboxes) {
      await deletePostQueue.add('sendChunk', {
        objectToSend: { ...objectToSend, signature: bodySignature.signature },
        petitionBy: user,
        inboxList: inboxChunk
      })
    }
  }
}
