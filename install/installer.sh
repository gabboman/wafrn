#!/bin/bash
set -o errexit
set -o pipefail

if [ "$EUID" -eq 0 ]
  then echo "Please run as a regular user that has 'sudo' access"
  exit
fi
echo "Remember, this script is made for Debian/Ubuntu based systems. It will install Docker, and then set up wafrn under it. Make sure you don't have anything running under ports 80 and 443"
echo
echo "Please make sure to read the docs before continuing. Or don't. You have been warned"
echo
echo "Please write the domain name of your wafrn instance."
echo "Make sure you have the domain pointing to this server"
read DOMAIN_NAME
echo
echo "If you wish to support Bluesky integration please enter your bluesky domain."
echo "This should be different from your wafrn instance, for example bsky.example.com"
echo "Make sure you point both <domain> AND *.<domain> to this server"
echo
echo "Use a fake domain, like bsky.example.com if you don't want to support Bluesky"
read PDS_DOMAIN_NAME
echo
echo "Ok now we need your email for the admin mail"
read ADMIN_EMAIL
echo
echo "What do you want the admin account to be called?"
echo "'admin' is a good choice"
read ADMIN_USER
echo
echo "Did you read the manual? We need a SMTP server config"
echo
echo "Tell us the SMTP host"
read SMTP_HOST
echo
echo "Tell us the SMTP port"
read SMTP_PORT
echo
echo "We need the SMTP username"
read SMTP_USER
echo
echo "Introduce the SMTP user password"
read SMTP_PASSWORD
echo
echo "We need the email address that will send the emails"
read SMTP_FROM
echo
echo "--------------------------------------------"
echo "Ok that was all. Let's get the party started"
echo "--------------------------------------------"

export DOMAIN_NAME PDS_DOMAIN_NAME ADMIN_EMAIL ADMIN_USER SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASSWORD SMTP_FROM

export CACHE_DOMAIN=${DOMAIN_NAME}
export MEDIA_DOMAIN=${DOMAIN_NAME}
export ACME_EMAIL=${ADMIN_EMAIL}

echo
echo "-------------------"
echo "Installing packages"
echo "-------------------"

sudo apt update
sudo apt dist-upgrade -y
sudo apt install -y git postgresql-client curl lsb-release wget build-essential sudo

echo
echo "-----------------"
echo "Installing docker"
echo "-----------------"

pushd $(mktemp -d)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh ./get-docker.sh
popd

sudo groupadd docker || true
sudo usermod -aG docker $USER

newgrp docker <<POST_DOCKER
#!/bin/bash
set -o errexit
set -o pipefail

echo
echo "-------------------------"
echo "Installing the repository"
echo "-------------------------"

cd $HOME
git clone https://github.com/gabboman/wafrn.git
cd wafrn

echo
echo "---------------------"
echo "Setting up the config"
echo "---------------------"

source install/env_secret_setup.sh

# Build and start the apps
docker compose build
docker compose up -d

echo
echo "----"
echo "Done"
echo "----"

echo "Well done. The database user and password have been introduced in the config file over at '~/wafrn/.env'"
echo
echo "You can log in at https://\${DOMAIN_NAME} with the email \${ADMIN_EMAIL} and the password \${ADMIN_PASSWORD}"
echo
echo "For the Bluesky integration to work make sure to read the docs on what to do as next steps."
echo "Before doing any activity however it is **highly** advised to log out and log back in to the shell"

POST_DOCKER
