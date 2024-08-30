<div align="center">
  <img src="https://app.wafrn.net/assets/logo.png" alt="Wafrn logo" width="350"/>
</div>

# WAFRN

Wafrn is an open source social network that connects with the Fediverse. The frontend is Tumblr-inspired. The "main" wafrn server is [app.wafrn.net](https://app.wafrn.net), but you can host your own if you're unhappy with my moderation style or simply and more probable, you would like to host your own stuff.

- [WAFRN](#wafrn)
  - [What will you need](#what-will-you-need)
  - [First steps](#first-steps)
  - [Populate database](#populate-database)
  - [Update wafrn](#update-wafrn)

## What will you need

Before trying to host your own wafrn, we advise you to please, very please, [join our matrix channel](https://matrix.to/#/!KFbQcLWJSAEcoKGxhl:matrix.org?via=matrix.org&via=t2bot.io) to get support

First, you will need a Debian 12 VPS. The cheap Contabo one can do the trick with no problem. Maybe even the OVH one that costs 3 euros too. But I advise as a minimum the Contabo one.
You also need a domain.
You will also need a way of sending emails to the people registering. An SMTP server or a free Brevo account with SMTP enabled can do the trick.

## First steps

First, point the domain to your Debian VPS. Once that is done, we download the installer and execute it, as root.
The installer will install all required packages, create the user and clone the repo and configure Apache.

> [!WARNING]
> **DO NOT PRESS ENTER BLINDLY DURING THE INSTALL PROCESS**, as it will ask some stuff and my bash-fu is not that good

Remember, run this as root!

```shell
wget https://raw.githubusercontent.com/gabboman/wafrn/main/install/installer.sh
bash installer.sh
```

This script will download all requirements and will create a user in your system.

Follow the instructions of the script. It will leave the system ready with wafrn installed, the frontend deployed and the server ready to start. You're almost there!

## Populate database

Ok, we have the stuff ready. Log in as the user we just created (it has asked it during the previous script)

Now we will edit the backend environment file
In this file, we edit the line `forceSync` and we set it to true to force it to create the database

```shell
cd wafrn
nano packages/backend/environment.ts
#forceSync: false -> forceSync: true
```

There is also an option called `adminPassword`. You can edit it too and set the admin password. In this state, it should be a random password.

Once we have edited the environment file, we can do the first start of the backend!

```shell
#We execute this command in the root of the project, in the wafrn folder.
pm2 start --name wafrn start.sh
```

After this, we need to set the `forcesync` to false in the previous file, and to delete the password from the environment.ts file

This step is VERY IMPORTANT. Without it, it will DESTROY YOUR DATABASE every time wafrn starts!

```shell
nano packages/backend/environment.ts
#forceSync: true -> forceSync: false
```

Now that we have the database ready and the environment ready, we register the workers with pm2

```shell
pm2 start --name workers -i max script_workers.sh
pm2 save
pm2 startup
```

This last command asks you to run something as root. Do it, so when the server restarts wafrn will also start.

You're ready!

> [!WARNING]
> Remember, remove the admin password from the environment.ts in the backend package!

## Update wafrn

To update wafrn, you just do the command `npm run full:upgrade` in the wafrn folder.

This will do a pull the latest changes and keep the waffle up to date
