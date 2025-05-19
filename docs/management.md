# Wafrn Management

## Exporting / backing up users

If any user asks you to backup their data, you can run the following command:

```sh
docker exec -ti wafrn-backend-1 npm exec tsx utils/maintenanceTasks/exportActivityPubBackup.ts <username>
```

Once export is finished this tool will write out a randomized URL to the console where the user can download their backup file. Once downloaded this file should be deleted manually from the server.
