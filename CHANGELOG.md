# Changelog

## 2025-06-19

Update your docker compose file
https://github.com/gabboman/wafrn/releases/tag/2025.07.1

## 2025-05-19

Support has been added to turn on metrics / monitoring using Prometheus, pgwatch and Grafana

To turn it on, replace your `docker-compose.yml` file with one of the others supporting `metrics`, like `docker-compose.simple.metrics.yml`.

You also need to set a few new environment variables, add the following to your `.env` files:

```sh
POSTGRES_METRICS_USER=pgwatch
POSTGRES_METRICS_PASSWORD=<some_random_password>
POSTGRES_METRICS_DBNAME=pgwatch_metrics
GF_SECURITY_ADMIN_PASSWORD=<some_other_random_password>
```

Once you run `docker compose up --build -d` you should be able to check your metrics at `https://monitoring.<your_wafrn_domain>`

## 2025-05-13

**BREAKING CHANGE**

If you're self hosting and wish to update from before `2025-05-13` please do the following updates:

- Make sure your DNS is configured so `*.<your_domain>` points to your Wafrn instance as well.,
- After pulling the latest changes the `docker-compose.yml` file will be removed. You will need to manually copy over `docker-compose.simple.yml` in it's place,
- You will also need to make the following changes in your `.env` file:

```sh
DOMAIN_NAME=<your_domain>
CACHE_DOMAIN=cdn.<your_domain>
MEDIA_DOMAIN=media.<your_domain>
FRONTEND_MEDIA_URL="https://media.<your_domain>"
FRONTEND_CACHE_URL="https://cdn.<your_domain>/api/cache?media="
```

## 2025-05-06

**BREAKING CHANGE**

If you're self hosting and wish to upgrade from a version before `2025-05-06` you will need to do the following upgrade steps:

Run the following command:

```sh
VAPID_KEYS="$(docker run -e NPM_CONFIG_UPDATE_NOTIFIER=false packageless/npx:latest --yes web-push generate-vapid-keys --json)"

echo Private Key:
echo "$VAPID_KEYS" | jq -r .privateKey

echo Public Key:
echo "$VAPID_KEYS" | jq -r .publicKey
```

And then add the following values to your `.env` file:

```sh
WEBPUSH_EMAIL=mailto:<your_admin_email>
WEBPUSH_PRIVATE=<private_key_from_above>
WEBPUSH_PUBLIC=<public_key_from_above>
```

If you have Bluesky enabled ou will also need to add the following to your `.env` file:

```sh
COMPOSE_PROFILES=bluesky
```
