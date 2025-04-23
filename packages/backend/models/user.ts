import {
  Model, Table, Column, DataType, ForeignKey, HasMany, BelongsToMany, BelongsTo
} from "sequelize-typescript";
import { MfaDetails } from "./mfaDetails.js";
import { Notification } from "./notification.js";
import { Ask } from "./ask.js";
import { QuestionPollAnswer } from "./questionPollAnswer.js";
import { EmojiReaction } from "./emojiReaction.js";
import { UserOptions } from "./userOptions.js";
import { PushNotificationToken } from "./pushNotificationToken.js";
import { Emoji } from "./emoji.js";
import { UserEmojiRelation } from "./userEmojiRelation.js";
import { Follows } from "./follows.js";
import { Blocks } from "./blocks.js";
import { Mutes } from "./mutes.js";
import { ServerBlock } from "./serverBlock.js";
import { PostReport } from "./postReport.js";
import { SilencedPost } from "./silencedPost.js";
import { UserReport } from "./userReport.js";
import { FederatedHost } from "./federatedHost.js";
import { Post } from "./post.js";
import { Media } from "./media.js";
import { PostMentionsUserRelation } from "./postMentionsUserRelation.js";
import { UserLikesPostRelations } from "./userLikesPostRelations.js";
import { UserBookmarkedPosts } from "./userBookmarkedPosts.js";
import { RemoteUserPostView } from "./remoteUserPostView.js";

export interface UserAttributes {
  email?: string;
  description?: string;
  descriptionMarkdown?: string;
  name?: string;
  url: string;
  nsfw?: boolean;
  avatar?: string;
  password?: string;
  birthDate?: Date;
  activated?: boolean;
  requestedPasswordReset?: Date;
  activationCode?: string;
  registerIp?: string;
  lastLoginIp?: string;
  lastTimeNotificationsCheck?: Date;
  privateKey?: string;
  publicKey?: string;
  federatedHostId?: string;
  remoteInbox?: string;
  remoteId?: string;
  remoteMentionUrl?: string;
  isBot?: boolean;
  banned?: boolean;
  role?: number;
  manuallyAcceptsFollows?: boolean;
  headerImage?: string;
  followersCollectionUrl?: string;
  followingCollectionUrl?: string;
  followerCount?: number;
  followingCount?: number;
  disableEmailNotifications?: boolean;
  enableBsky?: boolean;
  bskyAuthData?: string;
  bskyDid?: string;
  lastActiveAt?: Date;
}

@Table({
  tableName: "users",
  timestamps: true
})
export class User extends Model<UserAttributes, UserAttributes> implements UserAttributes {
  declare id: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  email?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  description?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  descriptionMarkdown?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  name?: string;

  @Column({
    type: DataType.STRING(768)
  })
  url!: string;

  @Column({
    field: "NSFW",
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  nsfw?: boolean;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  avatar?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  password?: string;

  @Column({
    allowNull: true,
    type: DataType.DATE
  })
  birthDate?: Date;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  activated?: boolean;

  @Column({
    allowNull: true,
    type: DataType.DATE
  })
  requestedPasswordReset?: Date;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  activationCode?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  registerIp?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  lastLoginIp?: string;

  @Column({
    type: DataType.DATE,
    defaultValue: new Date(0)
  })
  lastTimeNotificationsCheck?: Date;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  privateKey?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  publicKey?: string;

  @ForeignKey(() => FederatedHost)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  federatedHostId?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  remoteInbox?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  remoteId?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  remoteMentionUrl?: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  isBot?: boolean;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  banned?: boolean;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  role?: number;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  manuallyAcceptsFollows?: boolean;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  headerImage?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  followersCollectionUrl?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  followingCollectionUrl?: string;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  followerCount?: number;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  followingCount?: number;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  disableEmailNotifications?: boolean;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  enableBsky?: boolean;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  bskyAuthData?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  bskyDid?: string;

  @Column({
    allowNull: true,
    type: DataType.DATE,
    defaultValue: new Date(0)
  })
  lastActiveAt?: Date;

  @HasMany(() => MfaDetails, {
    sourceKey: "id"
  })
  mfaDetails?: MfaDetails[];

  @HasMany(() => Notification, {
    foreignKey: "notifiedUserId"
  })
  incomingNotifications?: Notification[];

  @HasMany(() => Notification, {
    sourceKey: "userId"
  })
  outgoingNotifications?: Notification[];

  @HasMany(() => Ask, {
    foreignKey: "userAsker"
  })
  userAsker?: Ask[];

  @HasMany(() => Ask, {
    foreignKey: "userAsks"
  })
  userAsks?: Ask[];

  @HasMany(() => QuestionPollAnswer, {
    sourceKey: "id"
  })
  questionPollAnswers?: QuestionPollAnswer[];

  @HasMany(() => EmojiReaction, {
    sourceKey: "id"
  })
  emojiReacions?: EmojiReaction[];

  @HasMany(() => UserOptions, {
    sourceKey: "id"
  })
  userOptions?: UserOptions[];

  @HasMany(() => PushNotificationToken, {
    sourceKey: "id"
  })
  pushNotificationTokens?: PushNotificationToken[];

  @BelongsToMany(() => Emoji, () => UserEmojiRelation)
  emojis?: Emoji[];

  @HasMany(() => Follows, {
    foreignKey: "followerId"
  })
  followerFollows?: Follows[];

  @HasMany(() => Follows, {
    foreignKey: "followsId"
  })
  followedFollows?: Follows[];

  @BelongsToMany(() => User, () => Follows, "followerId", "followsId")
  followers?: User[]

  @BelongsToMany(() => User, () => Follows, "followsId", "followerId")
  follows?: User[]

  @HasMany(() => Blocks, {
    foreignKey: "blockerId"
  })
  blockerBlocks?: Blocks[];

  @HasMany(() => Blocks, {
    foreignKey: "blockedId"
  })
  blockedBlocks?: Blocks[];

  @BelongsToMany(() => User, () => Blocks, "blockerId", "blockedId")
  blocker?: User[]

  @BelongsToMany(() => User, () => Blocks, "blockedId", "blockerId")
  blocked?: User[]

  @HasMany(() => Mutes, {
    foreignKey: "muterId"
  })
  muterMutes?: Mutes[];

  @HasMany(() => Mutes, {
    foreignKey: "mutedId"
  })
  mutedMutes?: Mutes[];

  @BelongsToMany(() => User, () => Mutes, "muterId", "mutesId")
  muter?: User[]

  @BelongsToMany(() => User, () => Mutes, "mutesId", "muterId")
  mutes?: User[]

  @HasMany(() => ServerBlock, {
    sourceKey: "id"
  })
  serverBlocks?: ServerBlock[];

  @HasMany(() => PostReport, {
    sourceKey: "id"
  })
  postReports?: PostReport[];

  @HasMany(() => SilencedPost, {
    sourceKey: "id"
  })
  silencedPosts?: SilencedPost[];

  @HasMany(() => UserReport, {
    foreignKey: "ReportedId"
  })
  reportedReport?: UserReport[];

  @HasMany(() => UserReport, {
    foreignKey: "ReporterId"
  })
  reporterReport?: UserReport[];

  @BelongsTo(() => FederatedHost)
  federatedHost?: FederatedHost;

  @HasMany(() => Post, {
    sourceKey: "id"
  })
  posts?: Post[];

  @HasMany(() => Media, {
    sourceKey: "id"
  })
  medias?: Media[];

  @HasMany(() => PostMentionsUserRelation, {
    sourceKey: "id"
  })
  postMentionsUserRelations?: PostMentionsUserRelation[];

  @HasMany(() => UserLikesPostRelations, {
    sourceKey: "id"
  })
  userLikesPostRelations?: UserLikesPostRelations[];

  @HasMany(() => UserBookmarkedPosts, {
    sourceKey: "id"
  })
  userBookmarkedPosts?: UserBookmarkedPosts[];

  @HasMany(() => RemoteUserPostView, {
    sourceKey: "id"
  })
  remoteUserPostViews?: RemoteUserPostView[];

  @Column(DataType.VIRTUAL)
  get isBlueSkyUser() {
    return !!(this.url.split('@').length == 2 && this.bskyDid)
  }

  @Column(DataType.VIRTUAL)
  get isFediverseUser() {
    return !!(this.url.split('@').length == 3 && this.remoteId)
  }
}
