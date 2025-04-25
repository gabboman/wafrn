<!-- markdownlint-disable first-line-h1 -->
<div align="center">

<a href="https://github.com/gabboman/wafrn">
  <img src="https://app.wafrn.net/assets/logo.png" alt="Wafrn logo" width="350"/>
</a>

**[Wafrn](https://github.com/gabboman/wafrn) &ndash; The social media that respects you.**

---

</div>

# Wafrn

Wafrn is an open source social network that connects with the Fediverse. The frontend is Tumblr-inspired.

The "main" wafrn app is located at [app.wafrn.net](https://app.wafrn.net).

- [Project structure](#project-structure)
- [Host Wafrn yourself](#host-wafrn-yourself)
  - [What will you need](#what-will-you-need)
  - [First steps](#first-steps)
  - [Populate database](#populate-database)
  - [Update wafrn](#update-wafrn)
- [Contributing](#contributing)
- [License](#license)

## Project Structure

Wafrn is split between an [Angular](https://angular.dev) frontend and a [NodeJS](https://nodejs.org/en) backend.

```text
packages/
├── frontend/
│   ├── routes/
│   ├── util/
│   ├── README.md
│   └── ...
└── backend/
    ├── src/
    │   ├── app/
    │   ├── assets/
    │   └── ...
    ├── README.md
    └── ...
```

(Tree made with [tree.nathanfriend.io](https://tree.nathanfriend.io/))

## Host Wafrn Yourself

### What will you need

Before trying to host your own wafrn, we advise you to please, very please, [join our discord channel](https://discord.gg/EXpCBpvM) to get support

You can either use the installer to get wafrn running, or follow the manual steps.

### Installer

First, you will need a Debian 12 VPS. The cheap Contabo one can do the trick with no problem. Maybe even the OVH one that costs 3 euros too. But I advise as a minimum the Contabo one.
You also need a domain name.
You will also need a way of sending emails to the people registering. An SMTP server or a free Brevo account with SMTP enabled can do the trick.

First, point the domain to your Debian VPS. Once that is done, we download the installer and execute it.

The installer will ask a few questions, then install docker and set up the application. It will be installed for the current logged in user.

**DO NOT PRESS ENTER BLINDLY DURING THE INSTALL PROCESS**, as it will ask some stuff and my bash-fu is not that good

```bash
wget https://raw.githubusercontent.com/gabboman/wafrn/main/install/installer.sh
bash installer.sh
```

Once this has been run successfully you should be able to login to your website using the credentials displayed. If you lost the values you can find them in the `~/wafrn/.env` file.

Note: due to the installer installing new user groups in the system and setting up some temporary environment variables it is **highly** advised to log out and log back in to avoid potential issues with your groups and environments.

### Manual install

If you don't wish to run a random bash script obtained from the internet, you can also install wafrn manually.

Pre-requisites: A linux based system with bash, git, build essentials and docker pre-installed.

#### Checkout project

You'll need to get the project files ready in a directory of your choice:

```bash
git clone git@github.com:gabboman/wafrn.git
cd wafrn
```

#### Configure environment

There is a convenience script that will generate secret values appropriately. To run type

```bash
bash install/env_secret_setup.sh
```

Next you'll need to fill in all of the details of your domain. For example if you're trying to run your website under `wafrn.example.com` (and your DNS is already pointing to the computer running docker) you'll need to update the following details:

```sh
DOMAIN_NAME=wafrn.example.com
CACHE_DOMAIN=wafrn.example.com
MEDIA_DOMAIN=wafrn.example.com
PDS_DOMAIN_NAME=bsky.example.com

ACME_EMAIL=admin@example.com
```

Note: even if you don't intend to run the Bluesky integration you'll need to set a `PDS_DOMAIN_NAME` that is different to the main domain you use. You can however make this a fake one, like `bsky.example.com`. If you don't intend to use Bluesky then it is also advised that you comment out the `pds` and `pds_worker` containers in your `docker-compose.yml` for security and performance reasons.

You'll also need to fill in the `SMTP` settings for emails to work.

#### Run

Next to run the setup just call

```
docker compose build && docker compose up
```

Once the scripts run and everything is okay you should be able to access your website at `https://wafrn.example.com`

### Updating

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

By default the installation will create a backup every day and keep it for 10 days

### BlueSky integraton

To enable the BlueSky integration follow the steps below:

1. Make sure to have `ENABLE_BSKY=false` for now, as the system will break otherwise

2. Create a new domain for your Bluesky service. For example we'll use `bsky.example.com`

3. Make sure in your DNS host both `bsky.example.com` and `*.bsky.example.com` points to the computer you're running docker compose

4. Run `docker compose up` to make sure everything is running

5. Run `./install/bsky/create-admin.sh`. This will create a user that the agent will use later and assign it to the admin account. If you use your admin account as your main (like on a single-user instance), then you can also provide a username to be generated (default is `wafrnadmin`), e.g. `./install/bsky/create-admin.sh myuser`. Make sure the username you chose is not one of the reserved names that cannot be used: https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/handle/reserved.ts

6. If the previous call was successful now you can enable `ENABLE_BSKY=true` in your config

7. Update and restart your system: `docker compose up --build -d`

8. Check if everything is still running

9. Use `./install/bsky/add-insert-code.sh` to add a new bluesky insert code to your system. You'll need to have one for any account you wish to enable bluesky for.

10. Open up your selected account profile and click "Enable bluesky". If all goes well, this account will now be enabled and accessible on Bluesky. Do note that some names are reserved under Bluesky and you won't be able to create an account for them, even on a personal server. For the full list of reserved names please see https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/handle/reserved.ts

## Contributing

If you would like to help develop the Frontend or Backend, read the README.md of the respective package.

- [Frontend - README.md](./packages/frontend/README.md)
- [Backend - README.md](./packages/backend/README.md)

## License

The frontend uses [Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/).

The backend uses [GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/)
