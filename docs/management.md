# Wafrn Management

## Exporting / backing up users

If any user asks you to backup their data, or you want to create a backup for yourself, you can run the following command:

```sh
docker exec -ti wafrn-backend-1 npm exec tsx utils/maintenanceTasks/exportActivityPubBackup.ts <username> <exportType>
```

The `exportType` can be one of the following:

* `1`: *Basic:* Only export the named blog, and local media files attached to the main blog. Result will be mostly compatible with what Mastodon would export as a backup. This is the default
* `2`: *Threaded:* Export the named blog, and all conversation information (post threads) related to the main blog. Also include all local media files for the blog and threads.
* `3`: *All-inclusive:* Same as `2`, but also downloads all linked remote media files and includes them in the backup.

> **Note:** Only the default option (`1`) will generate a backup file compatible with some Mastodon import tools, although if Bluesky is enabled it will also contain Bluesky posts that these importers might choke on. All options are supported by Wafrn's own importer however, including importing Bluesky data.

Once export is finished this tool will write out a randomized URL to the console where the user can download their backup file. Once downloaded this file should be deleted manually from the server.
