import { Model, Table, Column, DataType, ForeignKey, HasMany, BelongsToMany, BelongsTo } from 'sequelize-typescript'
import { MfaDetails } from './mfaDetails.js'
import { Notification } from './notification.js'
import { Ask } from './ask.js'
import { QuestionPollAnswer } from './questionPollAnswer.js'
import { EmojiReaction } from './emojiReaction.js'
import { UserOptions } from './userOptions.js'
import { PushNotificationToken } from './pushNotificationToken.js'
import { Emoji } from './emoji.js'
import { UserEmojiRelation } from './userEmojiRelation.js'
import { Follows } from './follows.js'
import { Blocks } from './blocks.js'
import { Mutes } from './mutes.js'
import { ServerBlock } from './serverBlock.js'
import { PostReport } from './postReport.js'
import { SilencedPost } from './silencedPost.js'
import { UserReport } from './userReport.js'
import { FederatedHost } from './federatedHost.js'
import { Post } from './post.js'
import { Media } from './media.js'
import { PostMentionsUserRelation } from './postMentionsUserRelation.js'
import { UserLikesPostRelations } from './userLikesPostRelations.js'
import { UserBookmarkedPosts } from './userBookmarkedPosts.js'
import { RemoteUserPostView } from './remoteUserPostView.js'
import {
  BelongsToGetAssociationMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  HasManyRemoveAssociationMixin
} from 'sequelize'
import { Col } from 'sequelize/lib/utils'

export interface UserAttributes {
  id?: string
  createdAt?: Date
  updatedAt?: Date
  email?: string | null
  description?: string
  descriptionMarkdown?: string
  name?: string
  url: string
  NSFW?: boolean
  avatar?: string
  password?: string
  birthDate?: Date
  activated?: boolean | null
  requestedPasswordReset?: Date | null
  activationCode?: string
  registerIp?: string
  lastLoginIp?: string
  lastTimeNotificationsCheck?: Date
  privateKey?: string | null
  publicKey?: string
  federatedHostId?: string | null
  remoteInbox?: string
  remoteId?: string
  remoteMentionUrl?: string
  isBot?: boolean
  banned?: boolean | null
  role?: number
  manuallyAcceptsFollows?: boolean
  headerImage?: string
  followersCollectionUrl?: string
  followingCollectionUrl?: string
  followerCount?: number
  followingCount?: number
  disableEmailNotifications?: boolean
  enableBsky?: boolean
  bskyAuthData?: string
  bskyDid?: string | null
  lastActiveAt?: Date
  hideFollows?: Boolean
  hideProfileNotLoggedIn?: Boolean
  emailVerified: Boolean | null
}

@Table({
  tableName: 'users',
  modelName: 'users',
  timestamps: true
})
export class User extends Model<UserAttributes, UserAttributes> implements UserAttributes {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  declare id: string

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare email: string | null

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare description: string

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare descriptionMarkdown: string

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare name: string

  @Column({
    type: DataType.STRING(768)
  })
  declare url: string

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare NSFW: boolean

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare avatar: string

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare password: string

  @Column({
    allowNull: true,
    type: DataType.DATE
  })
  declare birthDate: Date

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  declare activated: boolean | null

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  declare emailVerified: boolean | null

  @Column({
    allowNull: true,
    type: DataType.DATE
  })
  declare requestedPasswordReset: Date | null

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare activationCode: string

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare registerIp: string

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare lastLoginIp: string

  @Column({
    type: DataType.DATE,
    defaultValue: new Date(0)
  })
  declare lastTimeNotificationsCheck: Date

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare privateKey: string | null

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare publicKey: string

  @ForeignKey(() => FederatedHost)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare federatedHostId: string | null

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare remoteInbox: string

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare remoteId: string

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare remoteMentionUrl: string

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare isBot: boolean

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare banned: boolean | null

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  declare role: number

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare manuallyAcceptsFollows: boolean

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare headerImage: string

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare followersCollectionUrl: string

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare followingCollectionUrl: string

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  declare followerCount: number

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  declare followingCount: number

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare disableEmailNotifications: boolean

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare enableBsky: boolean

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare bskyAuthData: string

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare bskyDid: string | null

  @Column({
    allowNull: true,
    type: DataType.DATE,
    defaultValue: new Date(0)
  })
  declare lastActiveAt: Date

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare hideFollows: Boolean

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare hideProfileNotLoggedIn: Boolean

  @HasMany(() => MfaDetails, {
    sourceKey: 'id'
  })
  declare mfaDetails: MfaDetails[]

  @HasMany(() => Notification, {
    foreignKey: 'notifiedUserId'
  })
  declare incomingNotifications: Notification[]

  @HasMany(() => Notification, {
    foreignKey: 'userId'
  })
  declare outgoingNotifications: Notification[]

  @HasMany(() => Ask, {
    foreignKey: 'userAsker'
  })
  declare userAsker: Ask[]

  @HasMany(() => Ask, {
    foreignKey: 'userAsked'
  })
  declare userAsked: Ask[]

  @HasMany(() => QuestionPollAnswer, {
    sourceKey: 'id'
  })
  declare questionPollAnswers: QuestionPollAnswer[]

  @HasMany(() => EmojiReaction, {
    sourceKey: 'id'
  })
  declare emojiReacions: EmojiReaction[]

  @HasMany(() => UserOptions, {
    sourceKey: 'id'
  })
  declare userOptions: UserOptions[]

  @HasMany(() => PushNotificationToken, {
    sourceKey: 'id'
  })
  declare pushNotificationTokens: PushNotificationToken[]

  @BelongsToMany(() => Emoji, () => UserEmojiRelation)
  declare emojis: Emoji[]
  declare setEmojis: BelongsToManySetAssociationsMixin<Emoji, string>
  declare removeEmojis: BelongsToManyRemoveAssociationsMixin<Emoji, string>

  @HasMany(() => Follows, {
    foreignKey: 'followerId'
  })
  declare followerFollows: Follows[]

  @HasMany(() => Follows, {
    foreignKey: 'followedId'
  })
  declare followedFollows: Follows[]

  @BelongsToMany(() => User, () => Follows, 'followedId', 'followerId')
  declare follower: User[]
  declare getFollower: BelongsToManyGetAssociationsMixin<User>
  declare removeFollower: BelongsToManyRemoveAssociationMixin<User, string>

  @BelongsToMany(() => User, () => Follows, 'followerId', 'followedId')
  declare followed: User[]
  declare getFollowed: BelongsToManyGetAssociationsMixin<User>
  declare removeFollowed: BelongsToManyRemoveAssociationMixin<User, string>

  @HasMany(() => Blocks, {
    foreignKey: 'blockerId'
  })
  declare blockerBlocks: Blocks[]

  @HasMany(() => Blocks, {
    foreignKey: 'blockedId'
  })
  declare blockedBlocks: Blocks[]

  @BelongsToMany(() => User, () => Blocks, 'blockedId', 'blockerId')
  declare blocker: User[]
  declare addBlocker: BelongsToManyAddAssociationMixin<User, string>
  declare removeBlocker: BelongsToManyRemoveAssociationMixin<User, string>

  @BelongsToMany(() => User, () => Blocks, 'blockerId', 'blockedId')
  declare blocked: User[]

  @HasMany(() => Mutes, {
    foreignKey: 'muterId'
  })
  declare muterMutes: Mutes[]

  @HasMany(() => Mutes, {
    foreignKey: 'mutedId'
  })
  declare mutedMutes: Mutes[]

  @BelongsToMany(() => User, () => Mutes, 'mutedId', 'muterId')
  declare muter: User[]
  declare addMuter: BelongsToManyAddAssociationMixin<User, string>
  declare removeMuter: BelongsToManyRemoveAssociationMixin<User, string>

  @BelongsToMany(() => User, () => Mutes, 'muterId', 'mutedId')
  declare muted: User[]

  @HasMany(() => ServerBlock, {
    sourceKey: 'id'
  })
  declare serverBlocks: ServerBlock[]

  @HasMany(() => PostReport, {
    sourceKey: 'id'
  })
  declare postReports: PostReport[]

  @HasMany(() => SilencedPost, {
    sourceKey: 'id'
  })
  declare silencedPosts: SilencedPost[]

  @HasMany(() => UserReport, {
    foreignKey: 'ReportedId'
  })
  declare reportedReport: UserReport[]

  @HasMany(() => UserReport, {
    foreignKey: 'ReporterId'
  })
  declare reporterReport: UserReport[]

  @BelongsTo(() => FederatedHost, {
    foreignKey: {
      name: 'federatedHostId',
      allowNull: true
    }
  })
  declare federatedHost: FederatedHost
  declare getFederatedHost: BelongsToGetAssociationMixin<FederatedHost>

  @HasMany(() => Post, {
    sourceKey: 'id'
  })
  declare posts: Post[]

  @HasMany(() => Media, {
    sourceKey: 'id'
  })
  declare medias: Media[]

  @HasMany(() => PostMentionsUserRelation, {
    sourceKey: 'id'
  })
  declare pMURs: PostMentionsUserRelation[]

  @BelongsToMany(() => Post, () => PostMentionsUserRelation)
  declare mentionPost: Post[]

  @HasMany(() => UserLikesPostRelations, {
    sourceKey: 'id'
  })
  declare userLikesPostRelations: UserLikesPostRelations[]

  @HasMany(() => UserBookmarkedPosts, {
    sourceKey: 'id'
  })
  declare userBookmarkedPosts: UserBookmarkedPosts[]

  @HasMany(() => RemoteUserPostView, {
    sourceKey: 'id'
  })
  declare remoteUserPostViewList: RemoteUserPostView[]

  @Column(DataType.VIRTUAL)
  get isBlueskyUser() {
    return !!(this.url.split('@').length == 2 && this.bskyDid)
  }

  @Column(DataType.VIRTUAL)
  get isFediverseUser() {
    return !!(this.url.split('@').length == 3 && this.remoteId)
  }
}
