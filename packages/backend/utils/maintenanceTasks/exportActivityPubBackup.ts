/* eslint-disable @typescript-eslint/no-explicit-any */
// exports a user into an ActivityPub compatible backup file.

import fs from "fs";
import { Post, User } from "../../models/index.js";
import { userToJSONLD } from "../activitypub/userToJSONLD.js";
import archiver from "archiver";
import { v4 as uuidv4 } from 'uuid';
import { environment } from "../../completeEnvironment.js";
import { postToJSONLD } from "../activitypub/postToJSONLD.js";
import axios from "axios";

const archived: Record<string, boolean> = {};

async function extractImages(archive: archiver.Archiver, data: any, remoteFetch: boolean) {
  const promises: Promise<any>[] = [];
  if (Array.isArray(data)) {
    for (const value of data) {
      promises.push(extractImages(archive, value, remoteFetch));
    }
  } else if (typeof data === 'object') {
    for (const key in data) {
      const value = data[key];
      if (key == 'url' && typeof value === 'string') {
        // ugly hack to skip the main "url" objects in the post and blog events
        if (value.indexOf('fediverse/post') !== -1) {
        } else if (value.indexOf('fediverse/blog') !== -1) {
        } else if (value.startsWith(completeEnvironment.mediaUrl)) {
          const fileName = value.slice(completeEnvironment.mediaUrl.length + 1);
          const newFileName = `media_attachments/files/${fileName}`;
          if (!archived[fileName]) {
            console.log(`Media file ${value} - ${fileName}`);
            archived[fileName] = true;
            archive.file(`uploads/${fileName}`, { name: newFileName });
          }
          data[key] = `/${newFileName}`;
        } else if (remoteFetch) {
          const fileName = value.replaceAll(/[^.a-zA-Z0-9_-]/g, '_');
          const downloadedFile = await axios.get(completeEnvironment.externalCacheurl + value, { responseType: 'stream' }).catch(() => null);
          if (downloadedFile?.data) {
            const newFileName = `media_attachments/files/${fileName}`;
            if (!archived[fileName]) {
              console.log(`Remote media file ${value} - ${fileName}`);
              archived[fileName] = true;
              archive.append(downloadedFile.data, { name: newFileName });
            }
            data[key] = `/${newFileName}`;
          } else {
            console.log(`Could not download remote media file ${value} - ${fileName}`);
          }
        }
      } else {
        promises.push(extractImages(archive, value, remoteFetch));
      }
    }
  }
  return Promise.all(promises);
}

async function exportBackup(userUrl: string, exportType: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const user = await User.findOne({ where: { url: userUrl } });
    if (!user)
      return;

    const fileName = `backup-${userUrl}-${Date.now()}-${uuidv4()}.zip`;
    const output = fs.createWriteStream('uploads/' + fileName);

    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve(fileName);
    });

    archive.on('error', (err: Error) => {
      reject(err);
    });

    archive.pipe(output);

    // Export Blog
    const userData = await userToJSONLD(user);
    await extractImages(archive, userData, exportType == "3");
    archive.append(JSON.stringify(userData), { name: 'actor.json' });

    // Export Posts
    const outbox: any = {};
    outbox["@context"] = [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1",
      {
        "manuallyApprovesFollowers": "as:manuallyApprovesFollowers",
        "sensitive": "as:sensitive",
        "Hashtag": "as:Hashtag",
        "movedTo": {
          "@id": "as:movedTo",
          "@type": "@id"
        },
        "alsoKnownAs": {
          "@id": "as:alsoKnownAs",
          "@type": "@id"
        },
        "toot": "http://joinmastodon.org/ns#",
        "Emoji": "toot:Emoji",
        "featured": {
          "@id": "toot:featured",
          "@type": "@id"
        },
        "featuredTags": {
          "@id": "toot:featuredTags",
          "@type": "@id"
        },
        "schema": "http://schema.org#",
        "PropertyValue": "schema:PropertyValue",
        "value": "schema:value",
        "ostatus": "http://ostatus.org#",
        "atomUri": "ostatus:atomUri",
        "inReplyToAtomUri": "ostatus:inReplyToAtomUri",
        "conversation": "ostatus:conversation",
        "focalPoint": {
          "@container": "@list",
          "@id": "toot:focalPoint"
        },
        "blurhash": "toot:blurhash",
        "discoverable": "toot:discoverable",
        "indexable": "toot:indexable",
        "memorial": "toot:memorial",
        "votersCount": "toot:votersCount",
        "suspended": "toot:suspended",
        "attributionDomains": {
          "@id": "toot:attributionDomains",
          "@type": "@id"
        },
        "gts": "https://gotosocial.org/ns#",
        "interactionPolicy": {
          "@id": "gts:interactionPolicy",
          "@type": "@id"
        },
        "canQuote": {
          "@id": "gts:canQuote",
          "@type": "@id"
        },
        "automaticApproval": {
          "@id": "gts:automaticApproval",
          "@type": "@id"
        },
        "manualApproval": {
          "@id": "gts:manualApproval",
          "@type": "@id"
        }
      }
    ];
    outbox.id = "outbox.json";
    outbox.type = "OrderedCollection";
    outbox.orderedItems = [];
    for (const postItem of await user.getPosts({ order: [["createdAt", "ASC"]] })) {
      const postsToExport: Post[] = [postItem];
      if (exportType == "2" || exportType == "3") {
        while (postsToExport[0].parentId && await postsToExport[0].getParent()) {
          const parentPost = await postsToExport[0].getParent();
          postsToExport.unshift(parentPost);
        }
      }

      for (const post of postsToExport) {
        if (archived[post.id])
          continue;

        archived[post.id] = true;
        console.log(`Processing ${post.id}`);
        try {
          const postData = await postToJSONLD(post.id);
          if (postData) {
            await extractImages(archive, postData, exportType == "3");
            if (postData.type == "Create") {
              if (post.remotePostId) {
                postData.object.id = post.remotePostId;
              }
              const postUser = await post.getUser();

              if (postUser.remoteId) {
                postData.object.attributedTo = postUser.remoteId;
              }
              if (postUser.url.startsWith('@')) {
                // local posts also have bskyUri so this is to determine if this is a remote bluesky post&user
                if (post.bskyUri) {
                  postData.object.id = post.bskyUri;
                }
                if (postUser.bskyDid) {
                  postData.object.attributedTo = `at://${postUser.bskyDid}`;
                }
              }

              const postParent = post.parentId && await post.getParent({ include: 'user' });
              if (postParent) {
                if (postParent.user.url.startsWith('@') && postParent.bskyUri) {
                  postData.object.inReplyTo = postParent.bskyUri;
                }
              }
            } else if (postData.type == "Announce") {
              const postParent = post.parentId && await post.getParent({ include: 'user' });
              if (postParent) {
                if (postParent.bskyUri) {
                  postData.object = (await post.getParent()).bskyUri;
                }
              }
            }
            outbox.orderedItems.push(postData);
            delete outbox.orderedItems[outbox.orderedItems.length - 1]["@context"];
          }
        } catch (error) {
          console.log("Error during JSONLD processing");
          console.log(error);
        }
      }
    }
    outbox.totalItems = outbox.orderedItems.length;
    archive.append(JSON.stringify(outbox), { name: 'outbox.json' });

    // Export Likes

    const likes: any = { "@context": "https://www.w3.org/ns/activitystreams", "id": "likes.json", "type": "OrderedCollection", "orderedItems": [] }

    for (const like of await user.getUserLikesPostRelations({ include: Post })) {
      if (like.post) {
        const postUser = await like.post.getUser();
        const postRemoteId = like.post.remotePostId || (postUser.url.startsWith('@') && like.post.bskyUri ? like.post.bskyUri : `${completeEnvironment.frontendUrl}/fediverse/post/${like.post.id}`);
        likes.orderedItems.push(postRemoteId);
      }
    }

    archive.append(JSON.stringify(likes), { name: 'likes.json' });

    // Export Bookmarks

    const bookmarks: any = { "@context": "https://www.w3.org/ns/activitystreams", "id": "bookmarks.json", "type": "OrderedCollection", "orderedItems": [] }

    for (const bookmark of await user.getUserBookmarkedPosts({ include: Post })) {
      if (bookmark.post) {
        const postUser = await bookmark.post.getUser();
        const postRemoteId = bookmark.post.remotePostId || (postUser.url.startsWith('@') && bookmark.post.bskyUri ? bookmark.post.bskyUri : `${completeEnvironment.frontendUrl}/fediverse/post/${bookmark.post.id}`);
        bookmarks.orderedItems.push(postRemoteId);
      }
    }

    archive.append(JSON.stringify(bookmarks), { name: 'bookmarks.json' });

    archive.finalize();
  });
}

if (!process.argv[2]) {
  console.log("Usage: tsx exportActivityPubBackup.ts <localUserName> <exportType>");
  console.log("exportType:");
  console.log("  1: export blog's posts and it's media only (default)")
  console.log("  2: export blog's posts, the entire thread, and all local media")
  console.log("  3: export blog's posts, the entire thread, and both local and remote media files")
  process.exit(0);
}

const fileName = await exportBackup(process.argv[2], process.argv[3]);

console.log(`Exported to: ${completeEnvironment.mediaUrl}/${fileName}`);
process.exit(0);
