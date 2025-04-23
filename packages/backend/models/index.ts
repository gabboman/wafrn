import { sequelize } from "./sequelize.js";

import FederatedHost from './federatedHost.js'
import User from './user.js'
import UserOptions from './userOptions.js'
import PushNotificationToken from './pushNotificationToken.js'
import Quotes from './quotes.js'
import Follows from "./follows.js";
import Blocks from "./blocks.js";
import Mutes from "./mutes.js";
import ServerBlock from "./serverBlock.js";
import Post from "./post.js";
import SilencedPost from "./silencedPost.js";
import PostTag from "./postTag.js";
import Emoji from "./emoji.js";
import EmojiReaction from "./emojiReaction.js";
import EmojiCollection from "./emojiCollection.js";
import Media from "./media.js";
import PostReport from "./postReport.js";
import UserReport from "./userReport.js";
import PostMentionsUserRelation from "./postMentionsUserRelation.js";
import UserLikesPostRelations from "./userLikesPostRelations.js";
import UserBookmarkedPosts from "./userBookmarkedPosts.js";
import QuestionPoll from "./questionPoll.js";
import QuestionPollAnswer from "./questionPollAnswer.js";
import QuestionPollQuestion from "./questionPollQuestion.js";
import UserEmojiRelation from "./userEmojiRelation.js";
import PostEmojiRelations from "./postEmojiRelations.js";
import PostHostView from "./postHostView.js";
import RemoteUserPostView from "./remoteUserPostView.js";
import Ask from "./ask.js";
import Notification from "./notification.js";
import MfaDetails from "./mfaDetails.js";
import BskyInviteCodes from "./bskyInviteCodes.js";

User.hasMany(MfaDetails)
MfaDetails.belongsTo(User)

Notification.belongsTo(User, {
  as: 'notifiedUser'
})

Notification.belongsTo(User, {
  as: 'user'
})

Notification.belongsTo(Post, {
  constraints: false,
  foreignKey: 'postId'
})

Notification.belongsTo(EmojiReaction, {
  constraints: false
})

Post.hasOne(Ask)
Ask.belongsTo(Post)
User.hasMany(Ask, {
  as: 'userAsker',
  foreignKey: 'userAsked'
})
User.hasMany(Ask, {
  as: 'userAsked',
  foreignKey: 'userAsker'
})
Post.hasOne(QuestionPoll)
QuestionPoll.belongsTo(Post)
QuestionPoll.hasMany(QuestionPollQuestion, { onDelete: 'cascade' })
QuestionPollQuestion.belongsTo(QuestionPoll)
QuestionPollQuestion.hasMany(QuestionPollAnswer, { onDelete: 'cascade' })
QuestionPollAnswer.belongsTo(User)
QuestionPollAnswer.belongsTo(QuestionPollQuestion)

Post.hasMany(EmojiReaction, { onDelete: 'cascade' })
EmojiReaction.belongsTo(Post)
User.hasMany(EmojiReaction)
EmojiReaction.belongsTo(User)
EmojiReaction.belongsTo(Emoji)

User.hasMany(UserOptions)
UserOptions.belongsTo(User)

User.hasMany(PushNotificationToken)
PushNotificationToken.belongsTo(User)

User.hasMany(QuestionPollAnswer),
  User.belongsToMany(Emoji, {
    through: UserEmojiRelation
  })
User.belongsToMany(User, {
  through: Follows,
  as: 'followed',
  foreignKey: 'followerId'
})

Post.belongsToMany(Emoji, {
  through: PostEmojiRelations
})
Emoji.belongsToMany(Post, {
  through: PostEmojiRelations
})
Emoji.belongsTo(EmojiCollection)
EmojiCollection.hasMany(Emoji)
Emoji.belongsToMany(User, {
  through: UserEmojiRelation
})
User.belongsToMany(User, {
  through: Follows,
  as: 'follower',
  foreignKey: 'followedId'
})

Follows.belongsTo(User, {
  as: 'follower',
  foreignKey: 'followedId'
})

Follows.belongsTo(User, {
  as: 'followed',
  foreignKey: 'followerId'
})

User.belongsToMany(User, {
  through: Blocks,
  as: 'blocker',
  foreignKey: 'blockedId'
})

User.belongsToMany(User, {
  through: Blocks,
  as: 'blocked',
  foreignKey: 'blockerId'
})

Blocks.belongsTo(User, {
  as: 'blocker',
  foreignKey: 'blockerId'
})

Blocks.belongsTo(User, {
  as: 'blocked',
  foreignKey: 'blockedId'
})

User.belongsToMany(User, {
  through: Mutes,
  as: 'muter',
  foreignKey: 'mutedId'
})

User.belongsToMany(User, {
  through: Mutes,
  as: 'muted',
  foreignKey: 'muterId'
})

Mutes.belongsTo(User, {
  as: 'muter',
  foreignKey: 'muterId'
})

Mutes.belongsTo(User, {
  as: 'muted',
  foreignKey: 'mutedId'
})

ServerBlock.belongsTo(User, {
  as: 'userBlocker'
})
ServerBlock.belongsTo(FederatedHost, {
  as: 'blockedServer'
})

Post.belongsToMany(Post, {
  through: Quotes,
  as: 'quoted',
  foreignKey: 'quoterPostId'
})

Post.belongsToMany(Post, {
  through: Quotes,
  as: 'quoter',
  foreignKey: 'quotedPostId'
})

PostReport.belongsTo(User)
PostReport.belongsTo(Post)
Post.hasMany(PostReport, { onDelete: 'cascade' })
User.hasMany(PostReport, { onDelete: 'cascade' })
User.hasMany(SilencedPost, { as: 'silencedPost' })
Post.hasMany(SilencedPost, { as: 'silencedBy' }), SilencedPost.belongsTo(User)
SilencedPost.belongsTo(Post)
Post.hasMany(PostTag, { onDelete: 'cascade' })
PostTag.belongsTo(Post)

UserReport.belongsTo(User, { foreignKey: 'ReporterId' })
UserReport.belongsTo(User, { foreignKey: 'ReportedId' })

User.belongsTo(FederatedHost, { foreignKey: { name: 'federatedHostId', allowNull: true } })
FederatedHost.hasMany(User)
User.hasMany(Post)
Post.belongsTo(User, {
  as: 'user'
})
Post.isHierarchy()
Media.belongsTo(User)
Media.belongsTo(Post)
Post.hasMany(Media)

// mentions
User.belongsToMany(Post, {
  through: PostMentionsUserRelation,
  as: 'mentioner',
  foreignKey: 'userId'
})

Post.belongsToMany(User, {
  through: PostMentionsUserRelation,
  as: 'mentionPost',
  foreignKey: 'postId',
  onDelete: 'cascade'
})

UserLikesPostRelations.belongsTo(User)
UserLikesPostRelations.belongsTo(Post)
User.hasMany(UserLikesPostRelations, { onDelete: 'cascade' })
Post.hasMany(UserLikesPostRelations, { onDelete: 'cascade' })

UserBookmarkedPosts.belongsTo(User)
UserBookmarkedPosts.belongsTo(Post)
User.hasMany(UserBookmarkedPosts, { onDelete: 'cascade' })
Post.hasMany(UserBookmarkedPosts, { onDelete: 'cascade' })

FederatedHost.belongsToMany(Post, {
  through: PostHostView,
  as: 'postView'
})
Post.belongsToMany(FederatedHost, {
  through: PostHostView,
  as: 'hostView'
})

Post.belongsToMany(User, {
  through: RemoteUserPostView,
  as: 'view'
})
User.belongsToMany(Post, {
  through: RemoteUserPostView,
  as: 'postView'
})

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
