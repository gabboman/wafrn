/* eslint-disable @typescript-eslint/no-explicit-any */
// imports a user from an Activity Pub compatible ZIP backup file
import Zip from "node-stream-zip";
import { activityPubObject } from "../../interfaces/fediverse/activityPubObject.js";
import { CreateActivity } from "../activitypub/processors/create.js";
import { Post, User, UserBookmarkedPosts, UserLikesPostRelations } from "../../models/index.js";
import { AnnounceActivity } from "../activitypub/processors/announce.js";
import { getPostThreadRecursive } from "../activitypub/getPostThreadRecursive.js";
import { getAtProtoThread } from "../../atproto/utils/getAtProtoThread.js";

async function importBackup(fileName: string, userUrl: string) {
  const zip = new Zip.async({ file: fileName });
  let backupData: { orderedItems?: activityPubObject[] } = {};
  let likeData: { orderedItems?: string[] } = {};
  let bookmarkData: { orderedItems?: string[] } = {};
  let actorData: any = {};
  const mediaFiles: Record<string, boolean> = {};

  for (const entry of Object.values(await zip.entries())) {
    if (entry.name == "outbox.json") {
      backupData = JSON.parse(
        (await zip.entryData(entry)).toString("utf8").replaceAll("\\u0000", ""),
      );
    } else if (entry.name == "likes.json") {
      likeData = JSON.parse(
        (await zip.entryData(entry)).toString("utf8").replaceAll("\\u0000", ""),
      );
    } else if (entry.name == "bookmarks.json") {
      bookmarkData = JSON.parse(
        (await zip.entryData(entry)).toString("utf8").replaceAll("\\u0000", ""),
      );
    } else if (entry.name == "actor.json") {
      actorData = JSON.parse(
        (await zip.entryData(entry)).toString("utf8").replaceAll("\\u0000", ""),
      );
    } else if (entry.isFile) {
      mediaFiles[entry.name] = true;
    }
  }

  const user = await User.findOne({ where: { url: userUrl } });
  const actor = actorData.id;
  const generatedPosts: Post[] = [];

  if (user) {
    if (backupData?.orderedItems) {
      for (const item of backupData.orderedItems) {
        console.log(`Importing ${item.type} / ${item.id}`);
        if (item.type.toLowerCase() === "create") {
          try {
            const post = await getPostThreadRecursive(user, item.object.id, item.object, undefined, { allowMediaFromBanned: true });
            if (post) {
              generatedPosts.push(post);
            }
          } catch (e) {
            console.log(e);
          }
        } else if (item.type.toLowerCase() === "announce") {
          try {
            const post = await AnnounceActivity(item, user, user);
            if (post) {
              generatedPosts.push(post);
            }
          } catch (e) {
            console.log(e);
          }
        }
      }

      for (const post of generatedPosts) {
        console.log(`Processing ${post.id}`);
        if ((await post.getUser()).remoteId == actor) {
          post.remotePostId = null;
          post.userId = user.id;
          await post.save();
        }

        const medias = post.medias || await post.getMedias();
        for (const media of medias) {
          let oldMediaUrl = media.url.startsWith('/') ? media.url.substring(1) : media.url;
          if (mediaFiles[oldMediaUrl]) {
            let newMediaUrl = oldMediaUrl.replaceAll('/', '_');
            await zip.extract(oldMediaUrl, `uploads/${newMediaUrl}`);
            media.url = `/${newMediaUrl}`;
            media.external = false;
            await media.save();
          } else {
            console.log(`Missing media file from dump: ${oldMediaUrl}`);
          }
        }
      }
    }

    if (likeData?.orderedItems) {
      for (const like of likeData.orderedItems) {
        const post = await getPostThreadRecursive(user, like);
        if (post) {
          try {
            await UserLikesPostRelations.create({
              userId: user.id,
              postId: post.id
            });
          } catch (error) {
            console.log(`Could not like post ${like}`);
          }
        } else {
          console.log(`Did not find post to like ${like}`);
        }
      }
    }

    if (bookmarkData?.orderedItems) {
      for (const bookmark of bookmarkData.orderedItems) {
        const post = await getPostThreadRecursive(user, bookmark);
        if (post) {
          try {
            await UserBookmarkedPosts.create({
              userId: user.id,
              postId: post.id
            });
          } catch (error) {
            console.log(`Error during bookmark post ${bookmark}`);
          }
        } else {
          console.log(`Did not find post to bookmark ${bookmark}`);
        }
      }
    }
  }
  await zip.close();
}

if (!process.argv[3]) {
  console.log("Usage: tsx importActivityPubBackup.ts <backup.zip> <localUserName>");
  process.exit(0);
}

await importBackup(process.argv[2], process.argv[3]);
process.exit(0);
