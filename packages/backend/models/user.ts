import Ask from "./ask.js";
import EmojiReaction from "./emojiReaction.js";
import MfaDetails from "./mfaDetails.js";
import { sequelize, Sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";
import UserOptions from "./userOptions.js";
import PushNotificationToken from "./pushNotificationToken.js";
import QuestionPollAnswer from "./questionPollAnswer.js";
import Emoji from "./emoji.js";
import UserEmojiRelation from "./userEmojiRelation.js";
import Follows from "./follows.js";
import Blocks from "./blocks.js";
import Mutes from "./mutes.js";
import PostReport from "./postReport.js";
import SilencedPost from "./silencedPost.js";
import Post from "./post.js";
import PostMentionsUserRelation from "./postMentionsUserRelation.js";
import UserLikesPostRelations from "./userLikesPostRelations.js";
import UserBookmarkedPosts from "./userBookmarkedPosts.js";
import RemoteUserPostView from "./remoteUserPostView.js";
import FederatedHost from "./federatedHost.js";

const User = sequelize.define(
  'users',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(768),
      allowNull: true,
      unique: true
    },
    description: DataTypes.TEXT,
    descriptionMarkdown: DataTypes.TEXT,
    name: DataTypes.TEXT,
    url: {
      type: DataTypes.STRING(768),
      allowNull: false,
      unique: true
    },
    NSFW: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true
    },
    avatar: DataTypes.TEXT,
    password: DataTypes.TEXT,
    birthDate: DataTypes.DATE,
    activated: DataTypes.BOOLEAN,
    // we see the date that the user asked for a password reset. Valid for 2 hours
    requestedPasswordReset: DataTypes.DATE,
    // we use activationCode for activating the account & for reset the password
    // could generate some mistakes but consider worth it
    activationCode: DataTypes.STRING,
    registerIp: DataTypes.STRING,
    lastLoginIp: DataTypes.STRING,
    lastTimeNotificationsCheck: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(0)
    },
    privateKey: DataTypes.TEXT,
    publicKey: DataTypes.TEXT,
    federatedHostId: {
      type: DataTypes.UUID,
      allowNull: true,
      primaryKey: false
    },
    remoteInbox: DataTypes.TEXT,
    remoteId: {
      type: DataTypes.STRING(768),
      allowNull: true,
      unique: true
    },
    remoteMentionUrl: DataTypes.TEXT,
    isBot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    banned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    role: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    manuallyAcceptsFollows: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    headerImage: DataTypes.TEXT,
    followersCollectionUrl: DataTypes.TEXT,
    followingCollectionUrl: DataTypes.TEXT,
    followerCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    followingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    disableEmailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    enableBsky: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    bskyAuthData: {
      type: DataTypes.TEXT
    },
    bskyDid: {
      unique: true,
      type: DataTypes.STRING(768)
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      defaultValue: new Date(0),
      allowNull: true
    },
    isBlueskyUser: {
      type: DataTypes.VIRTUAL,
      get() {
        return !!(this.url.split('@').length == 2 && this.bskyDid)
      },
      set(value) {
        throw new Error('Do not try to set the `isBlueskyUser` value!')
      }
    },
    isFediverseUser: {
      type: DataTypes.VIRTUAL,
      get() {
        return !!(this.url.split('@').length == 3 && this.remoteId)
      },
      set(value) {
        throw new Error('Do not try to set the `isFediverseUser` value!')
      }
    }
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['remoteInbox'],
        type: 'FULLTEXT'
      },
      {
        unique: false,
        fields: ['banned']
      },
      {
        unique: false,
        fields: ['activated']
      },
      {
        unique: true,
        fields: [Sequelize.fn('lower', Sequelize.col('url'))]
      },
      {
        unique: true,
        fields: ['bskyDid']
      }
    ]
  }
)

export default User
