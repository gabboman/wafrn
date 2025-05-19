# Importing content

If you are running a self-hosted instance (or if the instance owner allows you) you can import content from various backup sources. Imports are only provided on a best-effort basis, and it is **strongly** advised to create a backup of your instance before trying to run imports, so you can roll them back if there are any issues

## Importing ActivityPub backups

You can import backups in the ActivityPub backup format, for example the ones that you can obtain from Mastodon's export function. The import will only import the posts and the attached media files from the backup. It will not import neither your blog settings, nor your likes. The import will also try to import the entire conversation chain of your posts - given those posts still exist in their original location. The backups usually don't contain these resources, so if these are gone from the internet then these threads will be incomplete.

To import follow the steps:

1. You need to create the user on the instance that will hold the posts. The importer will not change this user, so you'll have to manually set up the avatar, headers, and description.

2. Start up the backend. The workers need to be running during import, otherwise the import will hang.

3. Run the following command:

```sh
cp <filename.zip> packages/backend/uploads
docker exec -ti wafrn-backend-1 npm exec tsx utils/maintenanceTasks/importActivityPubBackup.ts uploads/<filename.zip> <local_username>
rm packages/backend/uploads/archive.zip
```

for example if your backup is called `archive.zip` and the user you created locally is `awesomeuser`:

```sh
cp archive.zip packages/backend/uploads
docker exec -ti wafrn-backend-1 npm exec tsx utils/maintenanceTasks/importActivityPubBackup.ts uploads/archive.zip awesomeuser
rm packages/backend/uploads/archive.zip
```

## Importing Tumblr backups

There is a [separate project](https://github.com/sztupy/tumblr-tools) allowing you to import your Tumblr blog over to Wafrn.
