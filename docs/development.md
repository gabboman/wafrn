# Developing wafrn

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

## Contributing

If you would like to help develop the Frontend or Backend, read the README.md of the respective package.

- [Frontend - README.md](../packages/frontend/README.md)
- [Backend - README.md](../packages/backend/README.md)

## Local setup

If you only want to develop Wafrn frontend, you can point it at a working instance. See [Frontend - README.md](../packages/frontend/README.md) for more details

If you want to setup both the backend and frontend locally there are a couple of helper scripts that can help you set up a local environment:

1. Run `./install/env_local_setup.sh`. This will setup the backend and frontend environment files to point to each other locally.

2. Run `docker compose up`. This will start up the required services: PostgreSQL, Redis and Caddy

> **Note:** If you're not a fan of docker, or you already have these services running, you can also install PostgreSQL, Redis and Caddy manually.

> **Note:** If you are running Caddy manually, or you are not using Docker Desktop but a more native docker installation, you will need to edit `packages/frontend/Caddyfile` and replace `host.docker.internal` with `localhost` for it to work properly.

3. Start up the backend:

```sh
cd packages/backend
npm i
npm run db:migrate
NODE_TLS_REJECT_UNAUTHORIZED=0 npm start
```

4. Start up the frontend:

```sh
cd packages/frontend
npm i
npm exec -- ng serve --host 0.0.0.0 --configuration=devlocal
```

5. IF all is well go to `https://localhost` to see your app

The default username/password for local installation is: `admin@example.com` / `Password1!`

> **Note:** You can run `caddy trust` to install Caddy's root certificates, to the system store. This will remove the security warnings from your browser. You can also do `caddy untrust` once you're finished with the development.

> **Warning:** Due to how the Fediverse and Bluesky operates not all features will be accessible when developing the backend locally. You might [want to host your own Wafrn instance](./deployment.md) as a staging server if you wish to develop features that require proper access to the Fediverse and/or Bluesky
