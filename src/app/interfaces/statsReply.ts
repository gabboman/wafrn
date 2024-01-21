import { bullMQMetric } from "./bullmq-metric";

export interface statsReply {
  sendPostFailed: bullMQMetric,
  sendPostSuccess: bullMQMetric,
  prepareSendFail: bullMQMetric,
  prepareSendSuccess: bullMQMetric,
  inboxFail: bullMQMetric,
  inboxSuccess: bullMQMetric,
  updateUserFail: bullMQMetric,
  updateUserSuccess: bullMQMetric
}
