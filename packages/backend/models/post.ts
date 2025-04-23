import {
  Model, Table, Column, DataType, ForeignKey, HasMany, HasOne, BelongsToMany, BelongsTo,
  BeforeFindAfterExpandIncludeAll,
  BeforeCreate
} from "sequelize-typescript";
import { Notification } from "./notification.js";
import { Ask } from "./ask.js";
import { QuestionPoll } from "./questionPoll.js";
import { EmojiReaction } from "./emojiReaction.js";
import { Emoji } from "./emoji.js";
import { PostEmojiRelations } from "./postEmojiRelations.js";
import { Quotes } from "./quotes.js";
import { PostReport } from "./postReport.js";
import { SilencedPost } from "./silencedPost.js";
import { PostTag } from "./postTag.js";
import { User } from "./user.js";
import { Media } from "./media.js";
import { PostMentionsUserRelation } from "./postMentionsUserRelation.js";
import { UserLikesPostRelations } from "./userLikesPostRelations.js";
import { UserBookmarkedPosts } from "./userBookmarkedPosts.js";
import { PostHostView } from "./postHostView.js";
import { RemoteUserPostView } from "./remoteUserPostView.js";
import { FederatedHost } from "./federatedHost.js";
import { PostAncestor } from "./postAncestor.js";
import { beforeCreate, beforeFindAfterExpandIncludeAll } from "./hiearchy/hiearchy.js";
import { isTemplateView } from "@atproto/api/dist/client/types/tools/ozone/communication/defs.js";

export interface PostAttributes {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  contentWarning?: string;
  content?: string;
  markdownContent?: string;
  title?: string;
  remotePostId?: string;
  bskyUri?: string;
  bskyCid?: string;
  privacy?: number;
  featured?: boolean;
  isReblog?: boolean;
  isDeleted?: boolean;
  userId?: string;
  hierarchyLevel?: number;
  parentId?: string;
}

@Table({
  tableName: "posts",
  timestamps: true
})
export class Post extends Model<PostAttributes, PostAttributes> implements PostAttributes {

  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  declare id: string;

  @Column({
    field: "content_warning",
    allowNull: true,
    type: DataType.STRING
  })
  declare contentWarning: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare content: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare markdownContent: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(256)
  })
  declare title: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare remotePostId: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare bskyUri: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare bskyCid: string;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  declare privacy: number;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare featured: boolean;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare isReblog: boolean;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare isDeleted: boolean;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare userId: string;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  declare hierarchyLevel: number;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare parentId: string;

  @BelongsTo(() => Post, "parentId")
  declare parent: Post

  @HasMany(() => Post, "parentId")
  declare children: Post[]

  @BelongsToMany(() => Post, () => PostAncestor, "postsId", "ancestorId")
  declare ancestors: Post[]

  @BelongsToMany(() => Post, () => PostAncestor, "ancestorId", "postsId")
  declare descendents: Post[]

  @HasMany(() => Notification, {
    sourceKey: "id"
  })
  declare notifications: Notification[];

  @HasOne(() => Ask, {
    sourceKey: "id"
  })
  declare ask: Ask;

  @HasOne(() => QuestionPoll, {
    sourceKey: "id"
  })
  declare questionPoll: QuestionPoll;

  @HasMany(() => EmojiReaction, {
    sourceKey: "id"
  })
  declare emojiReacions: EmojiReaction[];

  @BelongsToMany(() => Emoji, () => PostEmojiRelations)
  declare emojis: Emoji[];

  @HasMany(() => Quotes, {
    foreignKey: "quoterPostId"
  })
  declare quoterQuotes: Quotes[];

  @HasMany(() => Quotes, {
    foreignKey: "quotedPostId"
  })
  declare quotedQuotes: Quotes[];

  @BelongsToMany(() => Post, () => Quotes, "quotedPostId", "quoterPostId")
  declare quoted: Post[]

  @BelongsToMany(() => Post, () => Quotes, "quoterPostId", "quotedPostId")
  declare quoter: Post[]

  @HasMany(() => PostReport, {
    sourceKey: "id"
  })
  declare postReports: PostReport[];

  @HasMany(() => SilencedPost, {
    sourceKey: "id"
  })
  declare silencedPosts: SilencedPost[];

  @HasMany(() => PostTag, {
    sourceKey: "id"
  })
  declare postTags: PostTag[];

  @BelongsTo(() => User)
  declare user: User;

  @HasMany(() => Media, {
    sourceKey: "id"
  })
  declare medias: Media[];

  @HasMany(() => PostMentionsUserRelation, {
    sourceKey: "id"
  })
  declare postMentionsUserRelations: PostMentionsUserRelation[];

  @HasMany(() => UserLikesPostRelations, {
    sourceKey: "id"
  })
  declare userLikesPostRelations: UserLikesPostRelations[];

  @BelongsToMany(() => User, () => PostMentionsUserRelation)
  declare mentioner: User[];

  @HasMany(() => UserBookmarkedPosts, {
    sourceKey: "id"
  })
  declare userBookmarkedPosts: UserBookmarkedPosts[];

  @HasMany(() => PostHostView, {
    sourceKey: "id"
  })
  declare postHostViews: PostHostView[];

  @BelongsToMany(() => FederatedHost, () => PostHostView)
  declare hostView: FederatedHost[];

  @HasMany(() => RemoteUserPostView, {
    sourceKey: "id"
  })
  declare remoteUserPostViews: RemoteUserPostView[];

  @BelongsToMany(() => User, () => RemoteUserPostView)
  declare view: User[];

  get hiearchy() {
    return true
  }
}
