# Wafrn backend - Node.js REST API

This package is the backend of Wafrn.

The backend of Wafrn uses [NodeJS](https://nodejs.org/en). Have fun doing stuff ;D

- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [The domains](#the-domains)
  - [First steps: update and install stuff](#first-steps-update-and-install-stuff)
  - [Create a database](#create-a-database)
  - [Create a user for wafrn and prepare node for the user](#create-a-user-for-wafrn-and-prepare-node-for-the-user)
  - [Configuring Apache](#configuring-apache)
  - [Getting started with node and copying the code](#getting-started-with-node-and-copying-the-code)
  - [Configuring the frontend](#configuring-the-frontend)
- [Contributing](#contributing)
- [License](#license)

## Installation

<details>

Before trying to host your own wafrn, we advise you to please, very please, [join our matrix channel](https://matrix.to/#/!KFbQcLWJSAEcoKGxhl:matrix.org?via=matrix.org&via=t2bot.io) to get support, questions to the team and all those stuffs. Wafrn is an alpha software. Kinda. And you WILL find bugs. Either during the use or while trying to follow this manual. So yet again, [please join our matrix chatroom](https://matrix.to/#/!KFbQcLWJSAEcoKGxhl:matrix.org?via=matrix.org&via=t2bot.io). We recommend the client element if you're new to this.

### Prerequisites

You will need:

- A few hours
- A Linux machine with root access. This tutorial will assume Debian or derivates
- A domain where you can create subdomains
- We currently are using a strong free tier oracle VPS with 24 GB of RAM, but with our huge database we are using "only" 6 GB of RAM. I would advise for 4 or 8gb of ram.
- A domain for the frontend, a subdomain for the media, and another subdomain for the cache.
- We will install MySQL/MariaDB, Redis, Apache and Certbot. Feel free to skip what you know, but take a look to the Apache config file, it's important

### The domains

The frontend domain is the domain that people will use to find you on Fedi. In the prod instance, it's [app.wafrn.net](https://app.wafrn.net). Then referring to the media URL, we have [media.wafrn.net](https://media.wafrn.net), and finally for cache we have [cache.wafrn.net](https://cache.wafrn.net)

### First steps: update and install stuff

With the root user, do this command:

```shell
sudo apt update && apt dist-upgrade
sudo apt install curl mysql-server mysql apache2 certbot python3-certbot-apache build-essential redis ffmpeg webp graphicsmagick tmux
```

### Create a database

With the root user, we log in into the database with the command `mysql`. Then we create a db, and a user and a password:

```shell
mysql
```

```sql
CREATE DATABASE WAFRN;
CREATE USER 'wafrn'@'localhost' IDENTIFIED BY 'SAFE_PASSWORD';
GRANT ALL PRIVILEGES ON wafrn.* TO 'wafrn'@'localhost';
```

### Create a user for wafrn and prepare node for the user

You could install Node.js on the system level, but we do not recommend that. Instead, we advise you use [`nvm`](https://github.com/nvm-sh/nvm), both in your machine if you ever do something, and in the server.
Create a new system user. In this case, we are going to call it `wafrn`.

```shell
adduser wafrn
```

Now we will add the `wafrn` user to the `apache` group so we can use Apache to serve the image files and the static frontend

```shell
usermod -aG www-data wafrn
systemctl restart apache2
```

### Configuring Apache

We first have to enable some Apache modules first, and change some details in the config file

```shell
a2enmod proxy
a2enmod headers
a2enmod rewrite
systemctl restart apache2
```

Then we will edit the file `/etc/apache/apache2.conf` and we will edit this:

```apache
<Directory /var/www/>
        ......
</Directory>
# AFTER THIS WE WILL ADD THE NEW STUFF:
# this directory will point to the uploads folder inside thebackend
<Directory /home/wafrn/wafrn-backend/uploads>
        Options Indexes FollowSymLinks
        AllowOverride None
        Require all granted
</Directory>
# this directory will point towards the angular app compiled. We recommend doing this to avoid downtime when updating the front
# this directory will also be configured in the backend config later
<Directory /home/wafrn/front>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
</Directory>
```

The Fediverse does A LOT of petitions, and before wafrn starts lagging, Apache defaults will be a bigger issue for us!
Edit the file `/etc/apache2/mods_avaiable/mpm_worker.conf` and add this config

```apache
<IfModule mpm_worker_module>
ServerLimit 250
StartServers 10
MinSpareThreads 75
MaxSpareThreads 250
ThreadLimit 64
ThreadsPerChild 32
MaxRequestWorkers 8000 # like seriously wafrn would go slow because too many connections open for apache. This is where the fix was :D
MaxConnectionsPerChild 10000
</IfModule>
```

Now we will create the Fediverse media cacher Apache config

We will create the file `/etc/apache2/sites-avaiable/YOUR-CACHE-DOMAIN.conf` with this content. The cacher by default will run in the port 3002, if you need another port, change it

```apache
<VirtualHost *:80>
        ServerAdmin webmaster@localhost
        ServerName cache.wafrn.net #CHANGE THIS FOR YOUR CACHE DOMAIN
        RewriteEngine     on
        ProxyRequests off
        ProxyPreserveHost on
        ProxyPass / http://localhost:3002/ # we will assume port 3002
        ProxyPassReverse / http://localhost:3002/ #we will assume port 3002
        Header set Access-Control-Allow-Origin "*"

        ErrorLog ${APACHE_LOG_DIR}/error_cache.log
        CustomLog ${APACHE_LOG_DIR}/wafrn_cache.log combined
        # Possible values include: debug, info, notice, warn, error, crit,
        # alert, emerg.
        LogLevel warn
</VirtualHost>
```

And now we will create the Apache config file for multimedia files. We recommend doing this instead of using the wafrn integrated one, because it can be affected by wafrn CPU usage.
We create the file `/etc/apache2/sites-avaiable/YOUR-MEDIA-DOMAIN.conf` with this content:

```apache
<VirtualHost *:80>
        ServerName media.wafrn.net # CHANGE THIS
        ServerAdmin webmaster@localhost
        DocumentRoot /home/wafrn/wafrn-backend/uploads # make sure the uploads folder exist after downloading the backend.
        ErrorLog ${APACHE_LOG_DIR}/media_error.log
        CustomLog ${APACHE_LOG_DIR}/media_access.log combined
RewriteEngine on
RewriteCond %{SERVER_NAME} =media.wafrn.net
RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
```

Finally, the big one: we create the file to serve both the frontend and the backend:

We create the file `/etc/apache2/sites-avaiable/YOUR-FRONTEND-DOMAIN.conf` with this content. **TAKE A LOOK TO THE FILE, IT HAS IMPORTANT COMMENTS IN IT**. This might change in the future to something more user-friendly but for now, we have this.

```apache
<VirtualHost *:80>
                ServerAdmin webmaster@localhost
        ServerName app.wafrn.net # CHANGE THIS TO YOUR DOMAIN
        RewriteEngine     on
        ProxyRequests off
        ProxyPreserveHost on



        ProxyPass /api/ http://localhost:5000/api/ # WE WILL ASSUME PORT 5000
        ProxyPassReverse /api/ http://localhost:5000/api/

        ProxyPass /fediverse/ http://localhost:5000/fediverse/
        ProxyPassReverse / /fediverse http://localhost:5000/fediverse/

        ProxyPass /.well-known/ http://localhost:5000/.well-known/
        ProxyPassReverse /.well-known/ http://localhost:5000/.well-known

        ProxyPass /contexts/ http://localhost:5000/contexts/
        ProxyPassReverse /contexts/ http://localhost:5000/contexts/

        ProxyPass /post/ http://localhost:5000/post/
        ProxyPassReverse /post/ http://localhost:5000/post/

  Header set Access-Control-Allow-Origin "*"
  # next line can be ignored for single user instance. if you want users, to protect their privacy you need to set this up
  # so someone can not do shady stuff with themes
  Header set Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://YOURDOMAIN https://YOUR-CACHE-DOMAIN https://YOUR-MEDIA-DOMAIN; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://YOURDOMAIN; img-src 'self' https://YOUR-MEDIA-DOMAIN wafrncache.b-cdn.net; font-src 'self' https://YOUR-CACHE-DOMAIN https://YOUR-MEDIA-DOMAIN; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content"
        ErrorLog ${APACHE_LOG_DIR}/error_wafrn.log
        CustomLog ${APACHE_LOG_DIR}/wafrn_app.log combined
        # Possible values include: debug, info, notice, warn, error, crit,
        # alert, emerg.
        LogLevel warn
        # this one are the static frontend files so they dont go through the backend
        DocumentRoot /home/wafrn/front/
</VirtualHost>
```

### Getting started with node and copying the code

**Log in as the wafrn user**. Once you're there, time to install [`nvm`](https://github.com/nvm-sh/nvm).

```shell
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.profile
nvm install node 22
```

Once you have installed `nvm` and Node 18 in the wafrn user of your server, we will install the Angular CLI on the user, then clone the repositories

```shell
npm install -g @angular/cli
```

Now we will clone the repos that we need, and create the folder where the frontend will be served:

```shell
mkdir front
git clone https://github.com/gabboman/fediversemediacacher.git # the media cacher. its basically a proxy
git clone https://github.com/gabboman/wafrn.git #this is the frontend
git clone https://github.com/gabboman/wafrn-backend.git # the backend.
```

Now we have to get into each of the folders and install the dependencies. Just **go into each of the folders and do**

```shell
npm install
```

### Configuring the frontend

In the frontend folder, copy the environment file to environment.custom.ts

```shell
cp src/environment/environment.prod src/environment/environment.custom.ts
```

Now we will edit the file. The file has annotations,

```shell
npm start
```

</details>

## Contributing

TODO: Copy frontend version of this?

## License

[GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/)
