/* eslint-disable @typescript-eslint/no-explicit-any */
// exports a user into an ActivityPub compatible backup file.

import fs from "fs";
import { Post, User } from "../../models/index.js";
import { userToJSONLD } from "../activitypub/userToJSONLD.js";
import archiver from "archiver";
import { v4 as uuidv4 } from 'uuid';
import { environment } from "../../environment.js";
import { postToJSONLD } from "../activitypub/postToJSONLD.js";

const archived: Record<string, boolean> = {};

async function extractImages(archive: archiver.Archiver, data: any) {
  const promises: Promise<any>[] = [];
  if (Array.isArray(data)) {
    for (const value of data) {
      promises.push(extractImages(archive, value));
    }
  } else if (typeof data === 'object') {
    for (const key in data) {
      const value = data[key];
      if (key == 'url' && typeof value === 'string' && value.startsWith(environment.mediaUrl)) {
        const fileName = value.slice(environment.mediaUrl.length + 1);
        const newFileName = `media_attachments/files/${fileName}`;
        if (!archived[fileName]) {
          console.log(`Media file ${fileName}`);
          archived[fileName] = true;
          archive.file(`uploads/${fileName}`, { name: newFileName });
        }
        data[key] = `/${newFileName}`;
      } else {
        promises.push(extractImages(archive, value));
      }
    }
  }
  return Promise.all(promises);
}

async function exportBackup(userUrl: string): Promise<string> {
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
    await extractImages(archive, userData);
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
    for (const post of await user.getPosts({ order: [["createdAt", "ASC"]] })) {
      console.log(`Processing ${post.id}`);
      const postData = await postToJSONLD(post.id);
      if (postData) {
        await extractImages(archive, postData);
        outbox.orderedItems.push(postData);
        delete outbox.orderedItems[outbox.orderedItems.length - 1]["@context"];
      }
    }
    outbox.totalItems = outbox.orderedItems.length;
    archive.append(JSON.stringify(outbox), { name: 'outbox.json' });

    // Export Likes

    const likes: any = { "@context": "https://www.w3.org/ns/activitystreams", "id": "likes.json", "type": "OrderedCollection", "orderedItems": [] }

    for (const like of await user.getUserLikesPostRelations({ include: Post })) {
      if (like.post) {
        const postRemoteId = like.post?.remotePostId || `${environment.frontendUrl}/fediverse/post/${like.post?.id}`;
        likes.orderedItems.push(postRemoteId);
      }
    }

    archive.append(JSON.stringify(likes), { name: 'likes.json' });

    // Export Bookmarks

    const bookmarks: any = { "@context": "https://www.w3.org/ns/activitystreams", "id": "bookmarks.json", "type": "OrderedCollection", "orderedItems": [] }

    for (const bookmark of await user.getUserBookmarkedPosts({ include: Post })) {
      if (bookmark.post) {
        const postRemoteId = bookmark.post?.remotePostId || `${environment.frontendUrl}/fediverse/post/${bookmark.post?.id}`;
        bookmarks.orderedItems.push(postRemoteId);
      }
    }

    archive.append(JSON.stringify(bookmarks), { name: 'bookmarks.json' });

    archive.finalize();
  });
}

if (!process.argv[2]) {
  console.log("Usage: tsx exportActivityPubBackup.ts <localUserName>");
  process.exit(0);
}

const fileName = await exportBackup(process.argv[2]);

console.log(`Exported to: ${environment.mediaUrl}/${fileName}`);
process.exit(0);
