import { Job } from 'bullmq'
import { PostHostView, RemoteUserPostView } from '../../db.js'

async function processRemotePostView(job: Job) {
  // we move this to a queue to avoid doing the job as soon as we recive it
  const serverView = job.data.federatedHostId
  const userView = job.data.userId
  const postId = job.data.postId
  if (userView) {
    await RemoteUserPostView.findOrCreate({
      where: {
        userId: userView,
        postId: postId
      }

    })
  }
  if (serverView) {
    await PostHostView.findOrCreate({
      where: {
        federatedHostId: serverView,
        postId: postId
      }
    })
  }
}

export { processRemotePostView }
