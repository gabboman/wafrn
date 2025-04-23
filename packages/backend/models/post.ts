import {
  Model, Table, Column, DataType, ForeignKey, HasMany, HasOne, BelongsToMany, BelongsTo
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

export interface PostAttributes {
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
    type: DataType.UUID
  })
  declare id: string;

  @Column({
    field: "content_warning",
    allowNull: true,
    type: DataType.STRING
  })
  contentWarning?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  content?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  markdownContent?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(256)
  })
  title?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  remotePostId?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  bskyUri?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  bskyCid?: string;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  privacy?: number;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  featured?: boolean;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  isReblog?: boolean;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  isDeleted?: boolean;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  userId?: string;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  hierarchyLevel?: number;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  parentId?: string;

  @HasMany(() => Notification, {
    sourceKey: "id"
  })
  notifications?: Notification[];

  @HasOne(() => Ask, {
    sourceKey: "id"
  })
  ask?: Ask;

  @HasOne(() => QuestionPoll, {
    sourceKey: "id"
  })
  questionPoll?: QuestionPoll;

  @HasMany(() => EmojiReaction, {
    sourceKey: "id"
  })
  emojiReacions?: EmojiReaction[];

  @BelongsToMany(() => Emoji, () => PostEmojiRelations)
  emojis?: Emoji[];

  @HasMany(() => Quotes, {
    foreignKey: "quoterPostId"
  })
  quoterQuotes?: Quotes[];

  @HasMany(() => Quotes, {
    foreignKey: "quotedPostId"
  })
  quotedQuotes?: Quotes[];

  @BelongsToMany(() => Post, () => Quotes, "quotedPostId", "quoterPostId")
  quoted?: Post[]

  @BelongsToMany(() => Post, () => Quotes, "quoterPostId", "quotedPostId")
  quoter?: Post[]

  @HasMany(() => PostReport, {
    sourceKey: "id"
  })
  postReports?: PostReport[];

  @HasMany(() => SilencedPost, {
    sourceKey: "id"
  })
  silencedPosts?: SilencedPost[];

  @HasMany(() => PostTag, {
    sourceKey: "id"
  })
  postTags?: PostTag[];

  @BelongsTo(() => User)
  user?: User;

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

  @BelongsToMany(() => User, () => PostMentionsUserRelation)
  mentioner?: User[];

  @HasMany(() => UserBookmarkedPosts, {
    sourceKey: "id"
  })
  userBookmarkedPosts?: UserBookmarkedPosts[];

  @HasMany(() => PostHostView, {
    sourceKey: "id"
  })
  postHostViews?: PostHostView[];

  @BelongsToMany(() => FederatedHost, () => PostHostView)
  hostView?: FederatedHost[];

  @HasMany(() => RemoteUserPostView, {
    sourceKey: "id"
  })
  remoteUserPostViews?: RemoteUserPostView[];

  @BelongsToMany(() => User, () => RemoteUserPostView)
  view?: User[];
}
