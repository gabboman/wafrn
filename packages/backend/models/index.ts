import { sequelize } from "./sequelize.js";

import { Ask } from "./ask.js";
import { Blocks } from "./blocks.js";
import { BskyInviteCodes } from "./bskyInviteCodes.js";
import { Emoji } from "./emoji.js";
import { EmojiCollection } from "./emojiCollection.js";
import { EmojiReaction } from "./emojiReaction.js";
import { FederatedHost } from './federatedHost.js'
import { Follows } from "./follows.js";
import { Media } from "./media.js";
import { MfaDetails } from "./mfaDetails.js";
import { Mutes } from "./mutes.js";
import { Notification } from "./notification.js";
import { Post } from "./post.js";
import { PostAncestor } from "./postAncestor.js";
import { PostEmojiRelations } from "./postEmojiRelations.js";
import { PostHostView } from "./postHostView.js";
import { PostMentionsUserRelation } from "./postMentionsUserRelation.js";
import { PostReport } from "./postReport.js";
import { PostTag } from "./postTag.js";
import { PushNotificationToken } from './pushNotificationToken.js'
import { QuestionPoll } from "./questionPoll.js";
import { QuestionPollAnswer } from "./questionPollAnswer.js";
import { QuestionPollQuestion } from "./questionPollQuestion.js";
import { Quotes } from './quotes.js'
import { RemoteUserPostView } from "./remoteUserPostView.js";
import { ServerBlock } from "./serverBlock.js";
import { SilencedPost } from "./silencedPost.js";
import { User } from './user.js'
import { UserBookmarkedPosts } from "./userBookmarkedPosts.js";
import { UserEmojiRelation } from "./userEmojiRelation.js";
import { UserLikesPostRelations } from "./userLikesPostRelations.js";
import { UserOptions } from './userOptions.js'
import { UserReport } from "./userReport.js";
import { afterCreate, beforeBulkCreate, beforeBulkUpdate, beforeCreate, beforeUpdate } from "./hierarchy/hierarchy.js";
import { UnifiedPushData } from "./unifiedPushData.js";

sequelize.addModels([
  Ask,
  Blocks,
  BskyInviteCodes,
  Emoji,
  EmojiCollection,
  EmojiReaction,
  FederatedHost,
  Follows,
  Media,
  MfaDetails,
  Mutes,
  Notification,
  Post,
  PostAncestor,
  PostEmojiRelations,
  PostHostView,
  PostMentionsUserRelation,
  PostReport,
  PostTag,
  PushNotificationToken,
  QuestionPoll,
  QuestionPollAnswer,
  QuestionPollQuestion,
  Quotes,
  RemoteUserPostView,
  ServerBlock,
  SilencedPost,
  User,
  UserBookmarkedPosts,
  UserEmojiRelation,
  UserLikesPostRelations,
  UserOptions,
  UserReport,
  UnifiedPushData,
])

Post.addHook('beforeCreate', 'hierarchyBeforeCreate', beforeCreate);
Post.addHook('afterCreate', 'hierarchyAfterCreate', afterCreate);
Post.addHook('beforeUpdate', 'hierarchyBeforeUpdate', beforeUpdate);
Post.addHook('beforeBulkCreate', 'hierarchyBeforeBulkCreate', beforeBulkCreate);
Post.addHook('beforeBulkUpdate', 'hierarchyBeforeBulkUpdate', beforeBulkUpdate);

export {
  sequelize,
  Ask,
  Blocks,
  BskyInviteCodes,
  Emoji,
  EmojiCollection,
  EmojiReaction,
  FederatedHost,
  Follows,
  Media,
  MfaDetails,
  Mutes,
  Notification,
  Post,
  PostAncestor,
  PostEmojiRelations,
  PostHostView,
  PostMentionsUserRelation,
  PostReport,
  PostTag,
  PushNotificationToken,
  QuestionPoll,
  QuestionPollAnswer,
  QuestionPollQuestion,
  Quotes,
  RemoteUserPostView,
  ServerBlock,
  SilencedPost,
  User,
  UserBookmarkedPosts,
  UserEmojiRelation,
  UserLikesPostRelations,
  UserOptions,
  UserReport,
  UnifiedPushData,
}
