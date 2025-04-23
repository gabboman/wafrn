import { sequelize } from "./sequelize.js";

import { FederatedHost } from './federatedHost.js'
import { User } from './user.js'
import { UserOptions } from './userOptions.js'
import { PushNotificationToken } from './pushNotificationToken.js'
import { Quotes } from './quotes.js'
import { Follows } from "./follows.js";
import { Blocks } from "./blocks.js";
import { Mutes } from "./mutes.js";
import { ServerBlock } from "./serverBlock.js";
import { Post } from "./post.js";
import { SilencedPost } from "./silencedPost.js";
import { PostTag } from "./postTag.js";
import { Emoji } from "./emoji.js";
import { EmojiReaction } from "./emojiReaction.js";
import { EmojiCollection } from "./emojiCollection.js";
import { Media } from "./media.js";
import { PostReport } from "./postReport.js";
import { UserReport } from "./userReport.js";
import { PostMentionsUserRelation } from "./postMentionsUserRelation.js";
import { UserLikesPostRelations } from "./userLikesPostRelations.js";
import { UserBookmarkedPosts } from "./userBookmarkedPosts.js";
import { QuestionPoll } from "./questionPoll.js";
import { QuestionPollAnswer } from "./questionPollAnswer.js";
import { QuestionPollQuestion } from "./questionPollQuestion.js";
import { UserEmojiRelation } from "./userEmojiRelation.js";
import { PostEmojiRelations } from "./postEmojiRelations.js";
import { PostHostView } from "./postHostView.js";
import { RemoteUserPostView } from "./remoteUserPostView.js";
import { Ask } from "./ask.js";
import { Notification } from "./notification.js";
import { MfaDetails } from "./mfaDetails.js";
import { BskyInviteCodes } from "./bskyInviteCodes.js";

sequelize.addModels([
  User,
  UserOptions,
  PushNotificationToken,
  Blocks,
  Mutes,
  Post,
  PostReport,
  UserReport,
  PostTag,
  Follows,
  Media,
  Emoji,
  EmojiCollection,
  PostMentionsUserRelation,
  UserLikesPostRelations,
  UserBookmarkedPosts,
  FederatedHost,
  ServerBlock,
  SilencedPost,
  QuestionPoll,
  QuestionPollAnswer,
  QuestionPollQuestion,
  EmojiReaction,
  UserEmojiRelation,
  PostEmojiRelations,
  Quotes,
  PostHostView,
  RemoteUserPostView,
  Ask,
  Notification,
  BskyInviteCodes,
  MfaDetails
])

Post.isHiearchy()

export {
  sequelize,
  User,
  UserOptions,
  PushNotificationToken,
  Blocks,
  Mutes,
  Post,
  PostReport,
  UserReport,
  PostTag,
  Follows,
  Media,
  Emoji,
  EmojiCollection,
  PostMentionsUserRelation,
  UserLikesPostRelations,
  UserBookmarkedPosts,
  FederatedHost,
  ServerBlock,
  SilencedPost,
  QuestionPoll,
  QuestionPollAnswer,
  QuestionPollQuestion,
  EmojiReaction,
  UserEmojiRelation,
  PostEmojiRelations,
  Quotes,
  PostHostView,
  RemoteUserPostView,
  Ask,
  Notification,
  BskyInviteCodes,
  MfaDetails
}
