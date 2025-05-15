# Host Wafrn Yourself

## What will you need

If you need support you can also always find the latest Discord invite [on our website](https://wafrn.net)

Prerequisites:

1. Wafrn requires you to have a domain name you can fully configure. There are plenty of places to get one, and it's outside the scope of a guide like this to recommend any of them.
2. Time and dependent on the install method some or more knowledge of linux based systems.

To set up wafrn you have three options:

1. Use the automated scripts that set up wafrn on Oracle Cloud's Always Free infrastructure automatically. Also it's free<sup>*<sup>
2. Already have a Debian / Ubuntu based computer in the cloud, and use the installer script to set up wafrn
3. Have a modern Linux based box lying around somewhere and you want to install wafrn on it manually

<sup>*</sup>: You do need to accept Oracle's T&C, which might or might not contain crazy stuff. Also you'll need a Debit/Credit card for verification.

## Oracle Cloud

Use the below button to set up a fully working Wafrn instance on Oracle Cloud's Always Free instances:

[![Deploy to Oracle Cloud][magic_button]][magic_wafrn_basic_stack]

Documentation for the OCI integration [can be found in a separate repository](https://github.com/sztupy/wafrn-opentofu).

## Installer

Alternatively, you will need a Debian 12 VPS. The cheap Contabo one can do the trick with no problem. Maybe even the OVH one that costs 3 euros too. But I advise as a minimum the Contabo one.

You will also need a way of sending emails to the people registering. An SMTP server or a free Brevo account with SMTP enabled can do the trick.

First, point the domain to your Debian VPS. Once that is done, we download the installer and execute it.

The installer will ask a few questions, then install docker and set up the application. It will be installed for the current logged in user.

```bash
wget https://raw.githubusercontent.com/gabboman/wafrn/main/install/installer.sh
bash installer.sh
```

Once this has been run successfully you should be able to login to your website using the credentials displayed. If you lost the values you can find them in the `~/wafrn/.env` file.

Note: due to the installer installing new user groups in the system and setting up some temporary environment variables it is **highly** advised to log out and log back in to avoid potential issues with your groups and environments.

## Manual install

If you don't wish to run a random bash script obtained from the internet, you can also install wafrn manually.

Pre-requisites: A linux based system with bash, git, build essentials and docker pre-installed.

### Checkout project

You'll need to get the project files ready in a directory of your choice:

```bash
git clone git@github.com:gabboman/wafrn.git
cd wafrn
```

### Configure environment

There is a convenience script that will generate secret values appropriately. To run type

```bash
bash install/env_secret_setup.sh
```

Next you'll need to fill in all of the details of your domain. For example if you're trying to run your website under `wafrn.example.com` (and your DNS is already pointing to the computer running docker) you'll need to update the following details:

```sh
DOMAIN_NAME=wafrn.example.com
CACHE_DOMAIN=cache.wafrn.example.com
MEDIA_DOMAIN=media.wafrn.example.com
PDS_DOMAIN_NAME=bsky.example.com

 use the same domains as set above for MEDIA and CACHE
FRONTEND_MEDIA_URL="https://media.wafrn.example.com"
FRONTEND_CACHE_URL="https://cache.wafrn.example.com/api/cache?media="

ACME_EMAIL=admin@example.com
```

Note: even if you don't intend to run the Bluesky integration you'll need to set a `PDS_DOMAIN_NAME` that is different to the main domain you use. You can however make this a fake one, like `bsky.example.com`. Also it's advised to set `COMPOSE_PROFILES=default` in your `.env` file, so docker compose will not run the bluesky related containers.

You'll also need to fill in the `SMTP` settings for emails to work.

### Run

Next to run the setup just call

```
docker compose build && docker compose up
```

Once the scripts run and everything is okay you should be able to access your website at `https://wafrn.example.com`

## Updating and Backups

Before you update please check the [CHANGELOG.md](../CHANGELOG.md) for any breaking changes that you might need to be aware of

Go to your `wafrn` directory and enter:

```bash
git pull origin main
docker compose up --build -d
```

You can also find a small management script that can backup, restore and update your instance:

```bash
./install/manage.sh backup
./install/manage.sh update
```

By default the installation will create a backup every day and keep it for 10 days. You can also [add post-backup scripts](https://github.com/sztupy/wafrn-opentofu/blob/main/scripts/post_backup.template.sh) that you can configure to copy the backups to an off-site location, like any S3 compatible bucket.

You can also restore a backup if needed:

```bash
./install/manage.sh restore <backup_directory>
```

## BlueSky integraton

If you used the OCI integration or the installer and enabled Bluesky then it should already work you.

If you set up wafrn manually, then follow the steps below:

1. Make sure to have `ENABLE_BSKY=false` for now, as the system will break otherwise

2. Create a new domain for your Bluesky service. For example we'll use `bsky.example.com`

3. Make sure in your DNS host both `bsky.example.com` and `*.bsky.example.com` points to the computer you're running docker compose

4. Make sure `COMPOSE_PROFILES=bluesky` is set in your `.env` file

5. Run `docker compose up` to make sure everything is running

6. Run `./install/bsky/create-admin.sh`. This will create a user that the agent will use later and assign it to the admin account. If you use your admin account as your main (like on a single-user instance), then you can also provide a username to be generated (default is `wafrnadmin`), e.g. `./install/bsky/create-admin.sh myuser`. Make sure the username you chose is not one of the reserved names that cannot be used: https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/handle/reserved.ts

7. If the previous call was successful now you can enable `ENABLE_BSKY=true` in your config

8. Update and restart your system: `docker compose up --build -d`

9. Check if everything is still running

10. Use `./install/bsky/add-insert-code.sh` to add a new bluesky insert code to your system. You'll need to have one for any account you wish to enable bluesky for.

11. Open up your selected account profile and click "Enable bluesky". If all goes well, this account will now be enabled and accessible on Bluesky. Do note that some names are reserved under Bluesky and you won't be able to create an account for them, even on a personal server. For the full list of reserved names please see https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/handle/reserved.ts

[magic_button]: https://oci-resourcemanager-plugin.plugins.oci.oraclecloud.com/latest/deploy-to-oracle-cloud.svg
[magic_wafrn_basic_stack]: https://cloud.oracle.com/resourcemanager/stacks/create?zipUrl=https://github.com/sztupy/wafrn-opentofu/releases/latest/download/wafrn-opentofu-latest.zip
