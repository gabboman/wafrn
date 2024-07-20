import { Job } from 'bullmq'
import { PostHostView, RemoteUserPostView } from '../../db'

async function processRemotePostView(job: Job) {
  // we move this to a queue to avoid doing the job as soon as we recive it
  const serverView = job.data.federatedHostId
  const userView = job.data.userId
  const postId = job.data.postId
  try {
    if (userView) {
      await RemoteUserPostView.create({
        userId: userView,
        postId: postId
      })
    }
    if (serverView) {
      await PostHostView.create({
        federatedHostId: serverView,
        postId: postId
      })
    }
  } catch (error) {}
}

export { processRemotePostView }
