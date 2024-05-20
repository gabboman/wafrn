import { Op, Sequelize } from 'sequelize'
import { Emoji, FederatedHost, Post, QuestionPoll, QuestionPollAnswer, QuestionPollQuestion, User, sequelize } from '../../db'
import { environment } from '../../environment'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject'
import { postPetitionSigned } from './postPetitionSigned'
import { logger } from '../logger'
import { Queue } from 'bullmq'
import _ from 'underscore'
import { emojiToAPTag } from './emojiToAPTag'
import { wait } from '../wait'

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

async function voteInPoll(userId: string, pollId: number) {
    const user = await User.findByPk(userId)
    const votesToSend = await QuestionPollQuestion.findAll({
        include: [
            {
                model: QuestionPollAnswer,
                where: {
                    userId: userId
                }
            },
            {
                model: QuestionPoll,
                include: [
                    {
                        model: Post,
                        include: [
                            {
                                model: User,
                                as: 'user'
                            }
                        ]
                    }
                ]
            }
        ],
        where: {
            questionPollId: pollId
        }
    })

    for await (const vote of votesToSend) {
        const voteObject = {
            '@context': ['https://www.w3.org/ns/activitystreams', `${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
            actor: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
            id: `${environment.frontendUrl}/fediverse/voteActivity/${userId}/${votesToSend.id}`,
            object: {
                attributedTo: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
                id: `${environment.frontendUrl}/fediverse/vote/${userId}/${votesToSend.id}`,
                inReplyTo: vote.questionPoll.post.remotePostId,
                name: vote.questionText,
                to: vote.questionPoll.post.user.remoteId,
                type: `Note`
            },
            to: vote.questionPoll.post.user.remoteId,
            type: 'Create'
          }
        const inboxes = [vote.questionPoll.post.user.remoteInbox];
        await sendPostQueue.add(
            'sencChunk',
            {
              objectToSend: voteObject,
              petitionBy: user.dataValues,
              inboxList: inboxes
            },
            {
              priority: Number.MAX_SAFE_INTEGER
            }
          )
    }
    


}

export {voteInPoll}