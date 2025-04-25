import { DataTypes, QueryInterface, Sequelize } from 'sequelize';
import { Migration } from '../migrate.js';

/**
 * Actions summary:
 *
 * createTable "federatedHosts", deps: []
 * createTable "emojiCollections", deps: []
 * createTable "bskyInviteCodes", deps: []
 * createTable "users", deps: [federatedHosts]
 * createTable "userOptions", deps: [users]
 * createTable "pushNotificationTokens", deps: [users]
 * createTable "posts", deps: [users, posts]
 * createTable "follows", deps: [users, users]
 * createTable "blocks", deps: [users, users]
 * createTable "mutes", deps: [users, users]
 * createTable "serverBlocks", deps: [users, federatedHosts]
 * createTable "quotes", deps: [posts, posts]
 * createTable "silencedPosts", deps: [users, posts]
 * createTable "postTags", deps: [posts]
 * createTable "emojis", deps: [emojiCollections]
 * createTable "emojiReactions", deps: [posts, users, emojis]
 * createTable "medias", deps: [users, posts]
 * createTable "postReports", deps: [users, posts]
 * createTable "userReports", deps: [users, users]
 * createTable "userEmojiRelations", deps: [users, emojis]
 * createTable "postEmojiRelations", deps: [posts, emojis]
 * createTable "postMentionsUserRelations", deps: [users, posts]
 * createTable "userLikesPostRelations", deps: [users, posts]
 * createTable "userBookmarkedPosts", deps: [users, posts]
 * createTable "questionPolls", deps: [posts]
 * createTable "questionPollQuestions", deps: [questionPolls]
 * createTable "questionPollAnswers", deps: [questionPollQuestions, users]
 * createTable "postHostViews", deps: [federatedHosts, posts]
 * createTable "remoteUserPostViews", deps: [posts, users]
 * createTable "asks", deps: [posts, users, users]
 * createTable "mfaDetails", deps: [users]
 * createTable "notifications", deps: [users, users]
 * createTable "postsancestors", deps: [posts, posts]
 * addIndex "federated_hosts_blocked" to table "federatedHosts"
 * addIndex "federated_hosts_display_name" to table "federatedHosts"
 * addIndex "users_remote_inbox" to table "users"
 * addIndex "users_banned" to table "users"
 * addIndex "users_activated" to table "users"
 * addIndex "users_url" to table "users"
 * addIndex "users_bsky_did" to table "users"
 * addIndex "user_options_user_id_option_name" to table "userOptions"
 * addIndex "user_options_user_id" to table "userOptions"
 * addIndex "push_notification_tokens_token" to table "pushNotificationTokens"
 * addIndex "push_notification_tokens_user_id" to table "pushNotificationTokens"
 * addIndex "follows_follower_id" to table "follows"
 * addIndex "follows_followed_id" to table "follows"
 * addIndex "follows_followed_id_follower_id" to table "follows"
 * addIndex "follows_followed_id_accepted" to table "follows"
 * addIndex "blocks_blocker_id" to table "blocks"
 * addIndex "blocks_blocked_id" to table "blocks"
 * addIndex "blocks_blocked_id_blocker_id" to table "blocks"
 * addIndex "posts_parent_id" to table "posts"
 * addIndex "posts_user_id" to table "posts"
 * addIndex "posts_created_at" to table "posts"
 * addIndex "posts_created_at_user_id" to table "posts"
 * addIndex "posts_created_at_privacy" to table "posts"
 * addIndex "posts_featured" to table "posts"
 * addIndex "posts_user_id_title" to table "posts"
 * addIndex "posts_is_reblog" to table "posts"
 * addIndex "posts_is_reblog_parent_id" to table "posts"
 * addIndex "post_tags_" to table "postTags"
 * addIndex "post_tags_post_id" to table "postTags"
 * addIndex "emojis_name_external" to table "emojis"
 * addIndex "emoji_reactions_remote_id" to table "emojiReactions"
 * addIndex "medias_post_id" to table "medias"
 * addIndex "post_mentions_user_relations_post_id" to table "postMentionsUserRelations"
 * addIndex "post_mentions_user_relations_user_id" to table "postMentionsUserRelations"
 * addIndex "user_likes_post_relations_post_id" to table "userLikesPostRelations"
 * addIndex "asks_answered" to table "asks"
 * addIndex "asks_creation_ip" to table "asks"
 * addIndex "asks_created_at" to table "asks"
 * addIndex "mfa_details_user_id" to table "mfaDetails"
 * addIndex "notifications_notified_user_id" to table "notifications"
 * addIndex "notifications_notified_user_id_created_at" to table "notifications"
 * addIndex "notifications_notification_type_post_id" to table "notifications"
 * addIndex "notifications_user_id" to table "notifications"
 * addIndex "notifications_post_id" to table "notifications"
 *
 **/

type MigrationCommand = {
    fn: keyof QueryInterface,
    params: any[]
}

let migrationCommands: MigrationCommand[] = [{
    fn: "createTable",
    params: [
        "federatedHosts",
        {
            "id": {
                "type": DataTypes.UUID,
                "field": "id",
                "primaryKey": true,
                "allowNull": false,
                "defaultValue": DataTypes.UUIDV4
            },
            "displayName": {
                "type": DataTypes.TEXT,
                "field": "displayName"
            },
            "publicInbox": {
                "type": DataTypes.TEXT,
                "field": "publicInbox"
            },
            "publicKey": {
                "type": DataTypes.TEXT,
                "field": "publicKey"
            },
            "detail": {
                "type": DataTypes.STRING,
                "field": "detail"
            },
            "blocked": {
                "type": DataTypes.BOOLEAN,
                "field": "blocked",
                "defaultValue": false
            },
            "friendServer": {
                "type": DataTypes.BOOLEAN,
                "field": "friendServer",
                "defaultValue": false
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "emojiCollections",
        {
            "id": {
                "type": DataTypes.UUID,
                "field": "id",
                "primaryKey": true,
                "allowNull": false,
                "defaultValue": DataTypes.UUIDV4
            },
            "name": {
                "type": DataTypes.STRING,
                "field": "name"
            },
            "comment": {
                "type": DataTypes.TEXT,
                "field": "comment",
                "allowNull": true
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "bskyInviteCodes",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "code": {
                "type": DataTypes.STRING(512),
                "field": "code"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "users",
        {
            "id": {
                "type": DataTypes.UUID,
                "field": "id",
                "primaryKey": true,
                "allowNull": false,
                "defaultValue": DataTypes.UUIDV4
            },
            "email": {
                "type": DataTypes.STRING(768),
                "field": "email",
                "unique": true,
                "allowNull": true
            },
            "description": {
                "type": DataTypes.TEXT,
                "field": "description"
            },
            "descriptionMarkdown": {
                "type": DataTypes.TEXT,
                "field": "descriptionMarkdown"
            },
            "name": {
                "type": DataTypes.TEXT,
                "field": "name"
            },
            "url": {
                "type": DataTypes.STRING(768),
                "field": "url",
                "unique": true,
                "allowNull": false
            },
            "NSFW": {
                "type": DataTypes.BOOLEAN,
                "field": "NSFW",
                "allowNull": true,
                "defaultValue": false
            },
            "avatar": {
                "type": DataTypes.TEXT,
                "field": "avatar"
            },
            "password": {
                "type": DataTypes.TEXT,
                "field": "password"
            },
            "birthDate": {
                "type": DataTypes.DATE,
                "field": "birthDate"
            },
            "activated": {
                "type": DataTypes.BOOLEAN,
                "field": "activated"
            },
            "requestedPasswordReset": {
                "type": DataTypes.DATE,
                "field": "requestedPasswordReset"
            },
            "activationCode": {
                "type": DataTypes.STRING,
                "field": "activationCode"
            },
            "registerIp": {
                "type": DataTypes.STRING,
                "field": "registerIp"
            },
            "lastLoginIp": {
                "type": DataTypes.STRING,
                "field": "lastLoginIp"
            },
            "lastTimeNotificationsCheck": {
                "type": DataTypes.DATE,
                "field": "lastTimeNotificationsCheck",
                "defaultValue": Date.now(),
                "allowNull": false
            },
            "privateKey": {
                "type": DataTypes.TEXT,
                "field": "privateKey"
            },
            "publicKey": {
                "type": DataTypes.TEXT,
                "field": "publicKey"
            },
            "federatedHostId": {
                "type": DataTypes.UUID,
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "federatedHosts",
                    "key": "id"
                },
                "name": "federatedHostId",
                "field": "federatedHostId",
                "primaryKey": false,
                "allowNull": true
            },
            "remoteInbox": {
                "type": DataTypes.TEXT,
                "field": "remoteInbox"
            },
            "remoteId": {
                "type": DataTypes.STRING(768),
                "field": "remoteId",
                "unique": true,
                "allowNull": true
            },
            "remoteMentionUrl": {
                "type": DataTypes.TEXT,
                "field": "remoteMentionUrl"
            },
            "isBot": {
                "type": DataTypes.BOOLEAN,
                "field": "isBot",
                "defaultValue": false
            },
            "banned": {
                "type": DataTypes.BOOLEAN,
                "field": "banned",
                "defaultValue": false
            },
            "role": {
                "type": DataTypes.INTEGER,
                "field": "role",
                "defaultValue": 0
            },
            "manuallyAcceptsFollows": {
                "type": DataTypes.BOOLEAN,
                "field": "manuallyAcceptsFollows",
                "defaultValue": false
            },
            "headerImage": {
                "type": DataTypes.TEXT,
                "field": "headerImage"
            },
            "followersCollectionUrl": {
                "type": DataTypes.TEXT,
                "field": "followersCollectionUrl"
            },
            "followingCollectionUrl": {
                "type": DataTypes.TEXT,
                "field": "followingCollectionUrl"
            },
            "followerCount": {
                "type": DataTypes.INTEGER,
                "field": "followerCount",
                "defaultValue": 0
            },
            "followingCount": {
                "type": DataTypes.INTEGER,
                "field": "followingCount",
                "defaultValue": 0
            },
            "disableEmailNotifications": {
                "type": DataTypes.BOOLEAN,
                "field": "disableEmailNotifications",
                "defaultValue": false
            },
            "enableBsky": {
                "type": DataTypes.BOOLEAN,
                "field": "enableBsky",
                "defaultValue": false
            },
            "bskyAuthData": {
                "type": DataTypes.TEXT,
                "field": "bskyAuthData"
            },
            "bskyDid": {
                "type": DataTypes.STRING(768),
                "field": "bskyDid",
                "unique": true
            },
            "lastActiveAt": {
                "type": DataTypes.DATE,
                "field": "lastActiveAt",
                "allowNull": true,
                "defaultValue": new Date(0)
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "userOptions",
        {
            "userId": {
                "type": DataTypes.UUID,
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "field": "userId",
                "primaryKey": true,
                "allowNull": false,
                "defaultValue": DataTypes.UUIDV4
            },
            "optionName": {
                "type": DataTypes.STRING,
                "field": "optionName",
                "primaryKey": true,
                "allowNull": false
            },
            "optionValue": {
                "type": DataTypes.TEXT,
                "field": "optionValue"
            },
            "public": {
                "type": DataTypes.BOOLEAN,
                "field": "public",
                "defaultValue": false,
                "allowNull": true
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "pushNotificationTokens",
        {
            "token": {
                "type": DataTypes.STRING(768),
                "field": "token",
                "primaryKey": true,
                "allowNull": false
            },
            "userId": {
                "type": DataTypes.UUID,
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "field": "userId",
                "allowNull": false
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "posts",
        {
            "id": {
                "type": DataTypes.UUID,
                "field": "id",
                "primaryKey": true,
                "allowNull": false,
                "defaultValue": DataTypes.UUIDV4
            },
            "content_warning": {
                "type": DataTypes.TEXT,
                "field": "content_warning"
            },
            "content": {
                "type": DataTypes.TEXT,
                "field": "content"
            },
            "markdownContent": {
                "type": DataTypes.TEXT,
                "field": "markdownContent"
            },
            "title": {
                "type": DataTypes.STRING(256),
                "field": "title",
                "unique": false,
                "allowNull": true
            },
            "remotePostId": {
                "type": DataTypes.STRING(768),
                "field": "remotePostId",
                "unique": true,
                "allowNull": true
            },
            "bskyUri": {
                "type": DataTypes.STRING(768),
                "field": "bskyUri"
            },
            "bskyCid": {
                "type": DataTypes.STRING(768),
                "field": "bskyCid"
            },
            "privacy": {
                "type": DataTypes.INTEGER,
                "field": "privacy"
            },
            "featured": {
                "type": DataTypes.BOOLEAN,
                "field": "featured",
                "defaultValue": false,
                "allowNull": true
            },
            "isReblog": {
                "type": DataTypes.BOOLEAN,
                "field": "isReblog",
                "defaultValue": false,
                "allowNull": true
            },
            "isDeleted": {
                "type": DataTypes.BOOLEAN,
                "field": "isDeleted",
                "defaultValue": false,
                "allowNull": true
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "userId": {
                "type": DataTypes.UUID,
                "field": "userId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            },
            "hierarchyLevel": {
                "type": DataTypes.INTEGER,
                "field": "hierarchyLevel"
            },
            "parentId": {
                "type": DataTypes.UUID,
                "field": "parentId",
                "onUpdate": "CASCADE",
                "onDelete": "RESTRICT",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "follows",
        {
            "remoteFollowId": {
                "type": DataTypes.STRING(768),
                "field": "remoteFollowId",
                "unique": true,
                "allowNull": true
            },
            "accepted": {
                "type": DataTypes.BOOLEAN,
                "field": "accepted",
                "defaultValue": false
            },
            "bskyUri": {
                "type": DataTypes.STRING(768),
                "field": "bskyUri",
                "unique": true,
                "allowNull": true
            },
            "bskyPath": {
                "type": DataTypes.STRING(768),
                "field": "bskyPath",
                "unique": true,
                "allowNull": true
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "followerId": {
                "type": DataTypes.UUID,
                "allowNull": true,
                "field": "followerId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true
            },
            "followedId": {
                "type": DataTypes.UUID,
                "allowNull": true,
                "field": "followedId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "blocks",
        {
            "remoteBlockId": {
                "type": DataTypes.STRING(768),
                "field": "remoteBlockId",
                "unique": true,
                "allowNull": true
            },
            "reason": {
                "type": DataTypes.TEXT,
                "field": "reason"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "blockedId": {
                "type": DataTypes.UUID,
                "allowNull": true,
                "field": "blockedId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true
            },
            "blockerId": {
                "type": DataTypes.UUID,
                "allowNull": true,
                "field": "blockerId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "mutes",
        {
            "reason": {
                "type": DataTypes.TEXT,
                "field": "reason"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "mutedId": {
                "type": DataTypes.UUID,
                "allowNull": true,
                "field": "mutedId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true
            },
            "muterId": {
                "type": DataTypes.UUID,
                "allowNull": true,
                "field": "muterId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "serverBlocks",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "userBlockerId": {
                "type": DataTypes.UUID,
                "field": "userBlockerId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            },
            "blockedServerId": {
                "type": DataTypes.UUID,
                "field": "blockedServerId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "federatedHosts",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "quotes",
        {
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "quoterPostId": {
                "type": DataTypes.UUID,
                "field": "quoterPostId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "primaryKey": true
            },
            "quotedPostId": {
                "type": DataTypes.UUID,
                "field": "quotedPostId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "primaryKey": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "silencedPosts",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "superMuted": {
                "type": DataTypes.BOOLEAN,
                "field": "superMuted",
                "allowNull": true,
                "defaultValue": false
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "userId": {
                "type": DataTypes.UUID,
                "field": "userId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "postTags",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "tagName": {
                "type": DataTypes.TEXT,
                "field": "tagName"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "cascade",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "emojis",
        {
            "id": {
                "type": DataTypes.STRING,
                "field": "id",
                "primaryKey": true,
                "allowNull": false
            },
            "name": {
                "type": DataTypes.STRING,
                "field": "name"
            },
            "url": {
                "type": DataTypes.TEXT,
                "field": "url"
            },
            "external": {
                "type": DataTypes.BOOLEAN,
                "field": "external"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "emojiCollectionId": {
                "type": DataTypes.UUID,
                "field": "emojiCollectionId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "emojiCollections",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "emojiReactions",
        {
            "id": {
                "type": DataTypes.UUID,
                "field": "id",
                "primaryKey": true,
                "allowNull": false,
                "defaultValue": DataTypes.UUIDV4
            },
            "remoteId": {
                "type": DataTypes.STRING(768),
                "field": "remoteId",
                "unique": true,
                "allowNull": true
            },
            "content": {
                "type": DataTypes.TEXT,
                "field": "content"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "cascade",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "allowNull": true
            },
            "userId": {
                "type": DataTypes.UUID,
                "field": "userId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            },
            "emojiId": {
                "type": DataTypes.STRING,
                "field": "emojiId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "emojis",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "medias",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "mediaOrder": {
                "type": DataTypes.INTEGER,
                "field": "mediaOrder",
                "defaultValue": 0
            },
            "NSFW": {
                "type": DataTypes.BOOLEAN,
                "field": "NSFW"
            },
            "description": {
                "type": DataTypes.TEXT,
                "field": "description"
            },
            "url": {
                "type": DataTypes.TEXT,
                "field": "url"
            },
            "ipUpload": {
                "type": DataTypes.STRING,
                "field": "ipUpload"
            },
            "external": {
                "type": DataTypes.BOOLEAN,
                "field": "external",
                "allowNull": false,
                "defaultValue": false
            },
            "mediaType": {
                "type": DataTypes.STRING,
                "field": "mediaType"
            },
            "width": {
                "type": DataTypes.INTEGER,
                "field": "width",
                "defaultValue": 0
            },
            "height": {
                "type": DataTypes.INTEGER,
                "field": "height",
                "defaultValue": 0
            },
            "blurhash": {
                "type": DataTypes.STRING,
                "field": "blurhash"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "userId": {
                "type": DataTypes.UUID,
                "field": "userId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "postReports",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "resolved": {
                "type": DataTypes.BOOLEAN,
                "field": "resolved"
            },
            "severity": {
                "type": DataTypes.INTEGER,
                "field": "severity"
            },
            "description": {
                "type": DataTypes.TEXT,
                "field": "description"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "userId": {
                "type": DataTypes.UUID,
                "field": "userId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "userReports",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "resolved": {
                "type": DataTypes.BOOLEAN,
                "field": "resolved"
            },
            "severity": {
                "type": DataTypes.INTEGER,
                "field": "severity"
            },
            "description": {
                "type": DataTypes.TEXT,
                "field": "description"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "ReporterId": {
                "type": DataTypes.UUID,
                "field": "ReporterId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            },
            "ReportedId": {
                "type": DataTypes.UUID,
                "field": "ReportedId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "userEmojiRelations",
        {
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "userId": {
                "type": DataTypes.UUID,
                "field": "userId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true
            },
            "emojiId": {
                "type": DataTypes.STRING,
                "field": "emojiId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "emojis",
                    "key": "id"
                },
                "primaryKey": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "postEmojiRelations",
        {
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "primaryKey": true
            },
            "emojiId": {
                "type": DataTypes.STRING,
                "field": "emojiId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "emojis",
                    "key": "id"
                },
                "primaryKey": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "postMentionsUserRelations",
        {
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "userId": {
                "type": DataTypes.UUID,
                "field": "userId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "cascade",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "primaryKey": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "userLikesPostRelations",
        {
            "userId": {
                "type": DataTypes.UUID,
                "onUpdate": "CASCADE",
                "onDelete": "NO ACTION",
                "field": "userId",
                "unique": false,
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true,
                "allowNull": false
            },
            "postId": {
                "type": DataTypes.UUID,
                "onUpdate": "CASCADE",
                "onDelete": "NO ACTION",
                "field": "postId",
                "unique": false,
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "primaryKey": true,
                "allowNull": false
            },
            "remoteId": {
                "type": DataTypes.STRING(768),
                "field": "remoteId",
                "unique": true,
                "allowNull": true
            },
            "bskyPath": {
                "type": DataTypes.STRING(768),
                "field": "bskyPath",
                "unique": true,
                "allowNull": true
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "userBookmarkedPosts",
        {
            "userId": {
                "type": DataTypes.UUID,
                "onUpdate": "CASCADE",
                "onDelete": "NO ACTION",
                "field": "userId",
                "unique": false,
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true,
                "allowNull": false
            },
            "postId": {
                "type": DataTypes.UUID,
                "onUpdate": "CASCADE",
                "onDelete": "NO ACTION",
                "field": "postId",
                "unique": false,
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "primaryKey": true,
                "allowNull": false
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "questionPolls",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "endDate": {
                "type": DataTypes.DATE,
                "field": "endDate"
            },
            "multiChoice": {
                "type": DataTypes.BOOLEAN,
                "field": "multiChoice"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "questionPollQuestions",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "questionText": {
                "type": DataTypes.TEXT,
                "field": "questionText"
            },
            "index": {
                "type": DataTypes.INTEGER,
                "field": "index"
            },
            "remoteReplies": {
                "type": DataTypes.INTEGER,
                "field": "remoteReplies"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "questionPollId": {
                "type": DataTypes.INTEGER,
                "field": "questionPollId",
                "onUpdate": "CASCADE",
                "onDelete": "cascade",
                "references": {
                    "model": "questionPolls",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "questionPollAnswers",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "remoteId": {
                "type": DataTypes.STRING(768),
                "field": "remoteId",
                "unique": true,
                "allowNull": true
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "questionPollQuestionId": {
                "type": DataTypes.INTEGER,
                "field": "questionPollQuestionId",
                "onUpdate": "CASCADE",
                "onDelete": "cascade",
                "references": {
                    "model": "questionPollQuestions",
                    "key": "id"
                },
                "allowNull": true
            },
            "userId": {
                "type": DataTypes.UUID,
                "field": "userId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "postHostViews",
        {
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "federatedHostId": {
                "type": DataTypes.UUID,
                "field": "federatedHostId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "federatedHosts",
                    "key": "id"
                },
                "primaryKey": true
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "primaryKey": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "remoteUserPostViews",
        {
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "primaryKey": true
            },
            "userId": {
                "type": DataTypes.UUID,
                "field": "userId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "asks",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "question": {
                "type": DataTypes.TEXT,
                "field": "question"
            },
            "apObject": {
                "type": DataTypes.TEXT,
                "field": "apObject"
            },
            "creationIp": {
                "type": DataTypes.STRING,
                "field": "creationIp"
            },
            "answered": {
                "type": DataTypes.BOOLEAN,
                "field": "answered"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "allowNull": true
            },
            "userAsked": {
                "type": DataTypes.UUID,
                "field": "userAsked",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            },
            "userAsker": {
                "type": DataTypes.UUID,
                "field": "userAsker",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "mfaDetails",
        {
            "id": {
                "type": DataTypes.UUID,
                "field": "id",
                "primaryKey": true,
                "allowNull": false,
                "defaultValue": DataTypes.UUIDV4
            },
            "userId": {
                "type": DataTypes.UUID,
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "field": "userId",
                "unique": false,
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "primaryKey": true,
                "allowNull": false
            },
            "type": {
                "type": DataTypes.STRING,
                "field": "type"
            },
            "name": {
                "type": DataTypes.STRING,
                "field": "name"
            },
            "data": {
                "type": DataTypes.JSON,
                "field": "data"
            },
            "lastUsedData": {
                "type": DataTypes.JSON,
                "field": "lastUsedData"
            },
            "enabled": {
                "type": DataTypes.BOOLEAN,
                "field": "enabled"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "notifications",
        {
            "id": {
                "type": DataTypes.INTEGER,
                "field": "id",
                "autoIncrement": true,
                "primaryKey": true,
                "allowNull": false
            },
            "notificationType": {
                "type": DataTypes.STRING(128),
                "field": "notificationType"
            },
            "createdAt": {
                "type": DataTypes.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": DataTypes.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "notifiedUserId": {
                "type": DataTypes.UUID,
                "field": "notifiedUserId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            },
            "userId": {
                "type": DataTypes.UUID,
                "field": "userId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "users",
                    "key": "id"
                },
                "allowNull": true
            },
            "postId": {
                "type": DataTypes.UUID,
                "field": "postId",
                "allowNull": true
            },
            "emojiReactionId": {
                "type": DataTypes.UUID,
                "field": "emojiReactionId",
                "allowNull": true
            }
        },
        {}
    ]
},
{
    fn: "createTable",
    params: [
        "postsancestors",
        {
            "postsId": {
                "type": DataTypes.UUID,
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "unique": "postsancestors_postsId_ancestorId_unique",
                "field": "postsId",
                "primaryKey": true,
                "allowNull": false
            },
            "ancestorId": {
                "type": DataTypes.UUID,
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "posts",
                    "key": "id"
                },
                "unique": "postsancestors_postsId_ancestorId_unique",
                "field": "ancestorId",
                "primaryKey": true,
                "allowNull": false
            }
        },
        {}
    ]
},
{
    fn: "addIndex",
    params: [
        "federatedHosts",
        ["blocked"],
        {
            "indexName": "federated_hosts_blocked",
            "name": "federated_hosts_blocked"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "federatedHosts",
        {
            "indexName": "federated_hosts_",
            "unique": true,
            "fields": [Sequelize.fn("lower", Sequelize.col("displayName"))]
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "users",
        ["remoteInbox"],
        {
            "indexName": "users_remote_inbox",
            "name": "users_remote_inbox"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "users",
        ["banned"],
        {
            "indexName": "users_banned",
            "name": "users_banned"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "users",
        ["activated"],
        {
            "indexName": "users_activated",
            "name": "users_activated"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "users",
        {
            "indexName": "users_",
            "name": "users_",
            "fields": [Sequelize.fn("lower", Sequelize.col("url"))],
            "unique": true
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "users",
        ["bskyDid"],
        {
            "indexName": "users_bsky_did",
            "name": "users_bsky_did",
            "unique": true
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "userOptions",
        ["userId", "optionName"],
        {
            "indexName": "user_options_user_id_option_name",
            "name": "user_options_user_id_option_name",
            "unique": true
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "userOptions",
        ["userId"],
        {
            "indexName": "user_options_user_id",
            "name": "user_options_user_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "pushNotificationTokens",
        ["token"],
        {
            "indexName": "push_notification_tokens_token",
            "name": "push_notification_tokens_token",
            "unique": true
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "pushNotificationTokens",
        ["userId"],
        {
            "indexName": "push_notification_tokens_user_id",
            "name": "push_notification_tokens_user_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "follows",
        ["followerId"],
        {
            "indexName": "follows_follower_id",
            "name": "follows_follower_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "follows",
        ["followedId"],
        {
            "indexName": "follows_followed_id",
            "name": "follows_followed_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "follows",
        ["followedId", "followerId"],
        {
            "indexName": "follows_followed_id_follower_id",
            "name": "follows_followed_id_follower_id",
            "unique": true
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "follows",
        ["followedId", "accepted"],
        {
            "indexName": "follows_followed_id_accepted",
            "name": "follows_followed_id_accepted"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "blocks",
        ["blockerId"],
        {
            "indexName": "blocks_blocker_id",
            "name": "blocks_blocker_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "blocks",
        ["blockedId"],
        {
            "indexName": "blocks_blocked_id",
            "name": "blocks_blocked_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "blocks",
        ["blockedId", "blockerId"],
        {
            "indexName": "blocks_blocked_id_blocker_id",
            "name": "blocks_blocked_id_blocker_id",
            "unique": true
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "posts",
        ["parentId"],
        {
            "indexName": "posts_parent_id",
            "name": "posts_parent_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "posts",
        ["userId"],
        {
            "indexName": "posts_user_id",
            "name": "posts_user_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "posts",
        ["createdAt"],
        {
            "indexName": "posts_created_at",
            "name": "posts_created_at"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "posts",
        ["createdAt", "userId"],
        {
            "indexName": "posts_created_at_user_id",
            "name": "posts_created_at_user_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "posts",
        ["createdAt", "privacy"],
        {
            "indexName": "posts_created_at_privacy",
            "name": "posts_created_at_privacy"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "posts",
        ["featured"],
        {
            "indexName": "posts_featured",
            "name": "posts_featured"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "posts",
        ["userId", "title"],
        {
            "indexName": "posts_user_id_title",
            "name": "posts_user_id_title",
            "unique": true
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "posts",
        ["isReblog"],
        {
            "indexName": "posts_is_reblog",
            "name": "posts_is_reblog"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "posts",
        ["isReblog", "parentId"],
        {
            "indexName": "posts_is_reblog_parent_id",
            "name": "posts_is_reblog_parent_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "postTags",
        {
            "indexName": "post_tags_",
            "name": "post_tags_",
            "fields": [Sequelize.fn("lower", Sequelize.col("tagName"))]
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "postTags",
        ["postId"],
        {
            "indexName": "post_tags_post_id",
            "name": "post_tags_post_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "emojis",
        ["name", "external"],
        {
            "indexName": "emojis_name_external",
            "name": "emojis_name_external"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "emojiReactions",
        ["remoteId"],
        {
            "indexName": "emoji_reactions_remote_id",
            "name": "emoji_reactions_remote_id",
            "unique": true
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "medias",
        ["postId"],
        {
            "indexName": "medias_post_id",
            "name": "medias_post_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "postMentionsUserRelations",
        ["postId"],
        {
            "indexName": "post_mentions_user_relations_post_id",
            "name": "post_mentions_user_relations_post_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "postMentionsUserRelations",
        ["userId"],
        {
            "indexName": "post_mentions_user_relations_user_id",
            "name": "post_mentions_user_relations_user_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "userLikesPostRelations",
        ["postId"],
        {
            "indexName": "user_likes_post_relations_post_id",
            "name": "user_likes_post_relations_post_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "asks",
        ["answered"],
        {
            "indexName": "asks_answered",
            "name": "asks_answered"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "asks",
        ["creationIp"],
        {
            "indexName": "asks_creation_ip",
            "name": "asks_creation_ip"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "asks",
        ["createdAt"],
        {
            "indexName": "asks_created_at",
            "name": "asks_created_at"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "mfaDetails",
        ["userId"],
        {
            "indexName": "mfa_details_user_id",
            "name": "mfa_details_user_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "notifications",
        ["notifiedUserId"],
        {
            "indexName": "notifications_notified_user_id",
            "name": "notifications_notified_user_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "notifications",
        ["notifiedUserId", "createdAt"],
        {
            "indexName": "notifications_notified_user_id_created_at",
            "name": "notifications_notified_user_id_created_at"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "notifications",
        ["notificationType", "postId"],
        {
            "indexName": "notifications_notification_type_post_id",
            "name": "notifications_notification_type_post_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "notifications",
        ["userId"],
        {
            "indexName": "notifications_user_id",
            "name": "notifications_user_id"
        }
    ]
},
{
    fn: "addIndex",
    params: [
        "notifications",
        ["postId"],
        {
            "indexName": "notifications_post_id",
            "name": "notifications_post_id"
        }
    ]
}
];

export const up: Migration = function ({ context: queryInterface }) {
    let index = 0;
    return new Promise<void>(function (resolve, reject) {
        function next() {
            if (index < migrationCommands.length) {
                let command = migrationCommands[index];
                console.log("[#" + index + "] execute: " + command.fn);
                index++;
                const method = queryInterface[command.fn];
                if (typeof method === 'function') {
                    method.apply(queryInterface, command.params).then(next, reject);
                }
            }
            else
                resolve();
        }
        queryInterface.tableExists('federatedHosts').then(function (result) {
            if (result) {
                resolve();
            } else {
                next();
            }
        }, reject)
    });
}
