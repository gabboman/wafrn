import { Job } from 'bullmq'
import { logger } from '../logger'
import {
  Blocks,
  Emoji,
  EmojiReaction,
  FederatedHost,
  Follows,
  Media,
  Post,
  ServerBlock,
  User,
  UserLikesPostRelations,
  sequelize
} from '../../db'
import { getRemoteActor } from '../activitypub/getRemoteActor'
import { signAndAccept } from '../activitypub/signAndAccept'
import { environment } from '../../environment'
import { removeUser } from '../activitypub/removeUser'
import { getPostThreadRecursive } from '../activitypub/getPostThreadRecursive'
import { Op, Sequelize } from 'sequelize'
import { loadPoll } from '../activitypub/loadPollFromPost'
import { redisCache } from '../redis'
import getBlockedIds from '../cacheGetters/getBlockedIds'
import getUserBlockedServers from '../cacheGetters/getUserBlockedServers'
import { object } from 'underscore'
import { getUserIdFromRemoteId } from '../cacheGetters/getUserIdFromRemoteId'
import { follow } from '../follow'
import { getAllLocalUserIds } from '../cacheGetters/getAllLocalUserIds'
import { deletePostCommon } from '../deletePost'

async function inboxWorker(job: Job) {
  try {
    const user = await User.findByPk(job.data.petitionBy)
    const body = job.data.petition
    const req = { body: body }
    // little hack that should be fixed later
    if (req.body.type === 'Delete' && req.body.id.endsWith('#delete')) {
      const userToRemove = await User.findOne({
        where: {
          remoteId: req.body.id.split('#')[0].toLowerCase()
        }
      })
      if (userToRemove) {
        await removeUser(userToRemove.id)
        return
      }
    }
    const remoteUser = await getRemoteActor(req.body.actor, user)
    const host = await FederatedHost.findOne({
      where: {
        displayName: new URL(req.body.actor).host
      }
    })
    // we check if the user has blocked the user or the server. This will mostly work for follows and dms. Will investigate further down the line
    const userBlocks: string[] = await getBlockedIds(user.id, false)
    const blocksExisting = userBlocks.includes(remoteUser.id) ? 1 : 0
    const blockedServersData = await getUserBlockedServers(user.id)
    const blocksServers = blockedServersData.find((elem: any) => elem.id === host.id) ? 1 : 0
    if (!remoteUser?.banned && !host?.blocked && blocksExisting + blocksServers === 0) {
      switch (req.body.type) {
        case 'Accept': {
          if (req.body.object.type === 'Follow' && req.body.object.id.startsWith(environment.frontendUrl)) {
            const followUrl = req.body.object.id
            const partToRemove = `${environment.frontendUrl}/fediverse/follows/`
            const follows = followUrl.substring(partToRemove.length).split('/')
            if (follows.length === 2) {
              const followToUpdate = await Follows.findOne({
                where: {
                  followerId: follows[0],
                  followedId: follows[1]
                }
              })
              if (followToUpdate) {
                followToUpdate.accepted = true
                await followToUpdate.save()
                redisCache.del('follows:full:' + followToUpdate.followerId)
                redisCache.del('follows:notYetAcceptedFollows:' + followToUpdate.followerId)
              }
            }
          }
          break
        }
        case 'Announce': {
          // LEMMY HACK
          let urlToGet = typeof body.object === 'string' ? body.object : body.object.object
          urlToGet = typeof urlToGet === 'string' ? urlToGet : urlToGet?.id
          if (!urlToGet) {
            logger.debug(`trying to get a non existing url`)
            logger.debug(req.body)
            return null
          }
          // GOD LORD, THIS IS HERE JUST BECAUSE LEMMY.
          const retooted_content = await getPostThreadRecursive(user, urlToGet)

          if (!retooted_content) {
            logger.trace(`We could not get remote post to be retooted: ${urlToGet}`)
            logger.trace(body)
          }

          let privacy = 10
          if (req.body.to.indexOf('https://www.w3.org/ns/activitystreams#Public') !== -1) {
            // post is PUBLIC
            privacy = 0
          }
          if (req.body.to[0].toString().indexOf('followers') !== -1) {
            privacy = 1
          }
          if (remoteUser.url !== environment.deletedUser && retooted_content) {
            const postToCreate = {
              content: '',
              content_warning: '',
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: remoteUser.id,
              remotePostId: body.id,
              privacy: privacy,
              parentId: retooted_content.id
            }
            const newToot = await Post.create(postToCreate)
            await newToot.save()
            await signAndAccept({ body: body }, remoteUser, user)
          }
          break
        }
        case 'Create': {
          // Create new post
          const postRecived = body.object
          await getPostThreadRecursive(user, postRecived.id, postRecived)
          await signAndAccept({ body: body }, remoteUser, user)
          break
        }
        case 'Follow': {
          // Follow user
          const userToBeFollowed = await getRemoteActor(req.body.object, user)
          let remoteFollow = await Follows.findOne({
            where: {
              followerId: remoteUser.id,
              followedId: userToBeFollowed.id
            }
          })
          if (!remoteFollow) {
            remoteFollow = await Follows.create({
              followerId: remoteUser.id,
              followedId: userToBeFollowed.id,
              remoteFollowId: req.body.id,
              accepted: userToBeFollowed.url.startsWith('@') ? true : !userToBeFollowed.manuallyAcceptsFollows
            })
          }
          remoteFollow.save()
          // we accept it
          const acceptResponse = await signAndAccept(req, remoteUser, user)
          break
        }
        case 'Update': {
          const body = req.body.object
          switch (body.type) {
            //activities we ignore update
            case 'Video': {
              await signAndAccept(req, remoteUser, user)
              break;
            }
            case 'Question': {
              await loadPoll(body, await getPostThreadRecursive(user, body.id), user)
            }
            // eslint-disable-next-line no-fallthrough
            case 'Note': {
              const localPost = await Post.findOne({
                where: {
                  remotePostId: body.id
                }
              })
              await getPostThreadRecursive(user, body.id, body.object, localPost ? localPost.id : undefined)
              await signAndAccept(req, remoteUser, user)
              break
            }
            case 'Person': {
              if (body.id) {
                await getRemoteActor(body.id, user, true)
                await signAndAccept(req, remoteUser, user)
              }
              break
            }
            default: {
              logger.info(`update not implemented ${body.type}`)
              logger.info(body)
            }
          }
          break
        }
        case 'Undo': {
          // Unfollow? Destroy post? what else can be undone
          const body = req.body
          switch (body.object.type) {
            case 'Follow': {
              const remoteFollow = await Follows.findOne({
                where: {
                  // I think i was doing something wrong here. Changed so when remote unfollow does not cause you to unfollow them instead lol
                  remoteFollowId: body.object.id
                }
              })
              if (remoteFollow) {
                await remoteFollow.destroy()
              }
              await signAndAccept(req, remoteUser, user)
              break
            }
            case 'Undo': {
              // just undo? Might be like might be something else.
              const likeToRemove = await UserLikesPostRelations.findOne({
                where: {
                  remoteId: req.body.object.id
                }
              })
              if (likeToRemove) {
                await likeToRemove.destroy()
              }
              const emojiReactionToRemove = await EmojiReaction.findOne({
                where: {
                  remoteId: req.body.object.id
                }
              })
              if (emojiReactionToRemove) {
                await emojiReactionToRemove.destroy()
              }
              await signAndAccept(req, remoteUser, user)

              break
            }
            case 'Announce': {
              const postToDelete = await Post.findOne({
                where: {
                  remotePostId: req.body.object.id
                }
              })
              if (postToDelete) {
                await deletePostCommon(postToDelete.id)
              }
              await signAndAccept(req, remoteUser, user)
              break
            }
            case 'Like': {
              const likeToRemove = await UserLikesPostRelations.findOne({
                where: {
                  remoteId: body.id
                }
              })
              if (likeToRemove) {
                likeToRemove.destroy()
              }
            }
            // eslint-disable-next-line no-fallthrough
            case 'EmojiReact': {
              const reactionToRemove = await EmojiReaction.findOne({
                where: {
                  remoteId: body.id
                }
              })
              if (reactionToRemove) {
                await reactionToRemove.destroy()
              }
              await signAndAccept(req, remoteUser, user)
              break
            }
            // activities that we ignore:
            case 'View': {
              await signAndAccept(req, remoteUser, user)
              break
            }
            default: {
              logger.debug(`UNDO NOT IMPLEMENTED: ${body.object.type} attemping to delete post`)
              const postToDelete = await getPostThreadRecursive(user, req.body.object)
              if (postToDelete) {
                await deletePostCommon(postToDelete.id)
              }
              await signAndAccept(req, remoteUser, user)
              logger.debug(req.body)
            }
          }
          break
        }
        case 'Like': {
          const postToBeLiked = await getPostThreadRecursive(user, req.body.object)
          if (postToBeLiked) {
            if (body.content) {
              // GOD DAMMIT MISSKEY emojireact from misskey
              const existingReaction = await EmojiReaction.findOne({
                where: {
                  userId: remoteUser.id,
                  postId: postToBeLiked.id,
                  content: body.content
                }
              })
              const reaction = existingReaction
                ? existingReaction
                : await EmojiReaction.create({
                    remoteId: body.id,
                    content: body.content,
                    userId: remoteUser.id,
                    postId: postToBeLiked.id
                  })
              if (body.tag) {
                const emojiRemote = req.body.tag[0]
                const existingEmoji = await Emoji.findByPk(emojiRemote.id)
                const emojiToAdd = existingEmoji
                  ? existingEmoji
                  : await Emoji.create({
                      id: emojiRemote.id,
                      name: emojiRemote.name,
                      url: emojiRemote.icon.url,
                      external: true
                    })
                reaction.emojiId = emojiToAdd.id
                await reaction.save()
              }
            } else {
              try {
                const like = await UserLikesPostRelations.create({
                  userId: remoteUser.id,
                  postId: postToBeLiked.id,
                  remoteId: body.id
                })
              } catch (error) {
                logger.trace(`Error processing like user ${remoteUser.url} post ${postToBeLiked.id} ${body.id}`)
              }
            }
            await signAndAccept(req, remoteUser, user)
          }
          break
        }
        case 'Delete': {
          const body = req.body.object
          try {
            if (typeof body === 'string') {
              // we assume its just the url of an user
              await removeUser(req.body.object)
              await signAndAccept(req, remoteUser, user)
              break
            } else {
              switch (body.type) {
                case 'Block': {
                  logger.info('Remove block')
                  logger.debug(body)
                  const blockToRemove = await Blocks.findOne({
                    where: {
                      remoteId: body.id
                    }
                  })
                  if (blockToRemove) {
                    await blockToRemove.destroy()
                  }
                  await signAndAccept(req, remoteUser, user)
                  break
                }
                case 'Tombstone': {
                  const postToDelete = await Post.findOne({
                    where: {
                      remotePostId: body.id
                    }
                  })
                  if (postToDelete) {
                    await deletePostCommon(postToDelete.id)
                  }
                  await signAndAccept(req, remoteUser, user)
                  break
                }
                default:
                  {
                    logger.info(`DELETE not implemented ${body.type}`)
                    logger.info(body)
                  }
                  break
              }
            }
          } catch (error) {
            logger.trace({
              message: 'error with delete petition',
              error: error,
              petition: req.body
            })
          }
          break
        }
        case 'EmojiReact': {
          const postToReact = await getPostThreadRecursive(user, req.body.object)
          let emojiToAdd: any
          if (req.body.tag && req.body.tag.length === 1 && req.body.tag[0]?.icon) {
            const emojiRemote = req.body.tag[0]
            const existingEmoji = await Emoji.findByPk(emojiRemote.id)
            emojiToAdd = existingEmoji
              ? existingEmoji
              : await Emoji.create({
                  id: emojiRemote.id,
                  name: emojiRemote.name,
                  url: emojiRemote.icon.url,
                  external: true
                })
          }
          if (postToReact && req.body.content) {
            await EmojiReaction.create({
              remoteId: req.body.id,
              userId: remoteUser.id,
              content: req.body.content,
              postId: postToReact.id,
              emojiId: emojiToAdd?.id
            })
          }
          await signAndAccept(req, remoteUser, user)
          break
        }
        case 'Add': {
          const postToFeature = await getPostThreadRecursive(user, req.body.object)
          postToFeature.featured = true
          await postToFeature.save()
          await signAndAccept(req, remoteUser, user)
          break
        }
        case 'Block': {
          const userToBeBlocked = await getRemoteActor(body.object, user)
          Blocks.create({
            remoteId: body.id,
            blockedId: userToBeBlocked.id,
            blockerId: remoteUser.id
          })
          break
        }
        // WIP move
        // TODO get list of users who where following old account
        // then make them follow the new one, sending petition
        case 'Move': {
          logger.warn({ message: 'moving user being ignored', object: req.body })
          /*
          const newUser = await getRemoteActor(req.body.object, user)
          const followsToMove = await Follows.findAll({
            where: {
              followedId: remoteUser.id,
              accepted: true,
              [Op.and]: [
                {
                  followerId: {
                    [Op.notIn]: await Follows.findAll({
                      where: {
                        followedId: newUser.id
                      }
                    })
                  }
                },
                {
                  followerId: { [Op.in]: await getAllLocalUserIds() }
                }
              ]
            }
          })
          if (followsToMove && newUser) {
            const newFollows = followsToMove.map((elem: any) => {
              return follow(elem.followerId, newUser.id)
            })
            await Promise.allSettled(newFollows)
          }
          await signAndAccept(req, remoteUser, user)*/

          break
        }

        // activities that we ignore:
        case 'CacheFile':
        case 'View': {
          await signAndAccept(req, remoteUser, user)
          break
        }

        default: {
          logger.info(`NOT IMPLEMENTED: ${req.body.type}`)
          logger.info(req.body)
        }
      }
    }
  } catch (err) {
    logger.debug(err)
    const error = new Error('error')
  }
}

export { inboxWorker }
