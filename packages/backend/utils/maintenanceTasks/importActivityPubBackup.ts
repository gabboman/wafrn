/* eslint-disable @typescript-eslint/no-explicit-any */
// imports a ZIP file containing Tumblr API dumps in JSON format into the database
import fs from "fs";
import Zip from "node-stream-zip";
import { activityPubObject } from "../../interfaces/fediverse/activityPubObject.js";
import { CreateActivity } from "../activitypub/processors/create.js";
import { Post, User } from "../../models/index.js";

async function importBackup(fileName: string, userUrl: string) {
  const zip = new Zip.async({ file: fileName });
  let backupData: { orderedItems?: activityPubObject[] } = {};
  const mediaFiles: Record<string, boolean> = {};

  for (const entry of Object.values(await zip.entries())) {
    if (entry.name == "outbox.json") {
      backupData = JSON.parse(
        (await zip.entryData(entry)).toString("utf8").replaceAll("\\u0000", ""),
      );
    } else if (entry.name.indexOf("media_attachments/files") !== -1 && entry.isFile) {
      mediaFiles[entry.name] = true;
    }
  }

  const user = await User.findOne({ where: { url: userUrl } });
  const generatedPosts: Post[] = [];

  if (backupData.orderedItems && user) {
    for (const item of backupData.orderedItems) {
      console.log(`Importing ${item.id}`);
      try {
        const post = await CreateActivity(item, user, user);
        if (post) {
          generatedPosts.push(post);
        }
      } catch (e) {
        console.log(e);
      }
    }

    for (const post of generatedPosts) {
      console.log(`Processing ${post.id}`);
      post.remotePostId = null;
      post.userId = user.id;
      await post.save();

      const medias = post.medias || await post.getMedias();
      for (const media of medias) {
        let oldMediaUrl = media.url.substring(1);
        if (mediaFiles[oldMediaUrl]) {
          let newMediaUrl = oldMediaUrl.replaceAll('/', '_');
          await zip.extract(oldMediaUrl, `uploads/${newMediaUrl}`);
          media.url = `/${newMediaUrl}`;
          media.external = false;
          await media.save();
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
