#!/bin/bash
set -o errexit
set -o pipefail

if [ "$EUID" -eq 0 ]; then
  echo "Please run as a regular user that has 'sudo' access"
  exit
fi

if [ "$1" == "--unattended" ]; then
  # This will be put there by cloud-init. We only need it to load up the variables then we can discard
  if [ -f /wafrn-cloud-config ]; then
    sudo chmod 755 /wafrn-cloud-config
    source /wafrn-cloud-config
    sudo rm /wafrn-cloud-config
  fi
else
  echo "Remember, this script is made for Debian/Ubuntu based systems. It will install Docker, and then set up wafrn under it. Make sure you don't have anything running under ports 80 and 443"
  echo
  echo "Please make sure to read the docs before continuing. Or don't. You have been warned"
  echo
  echo "Please write the domain name of your wafrn instance."
  echo "Make sure you have the domain pointing to this server"
  read DOMAIN_NAME
  echo
  echo "Ok now we need an email for the administrator user"
  read ADMIN_EMAIL
  echo
  echo "We now need a handle for your administrator user. If this will be a personal, single-user instance then you can enter the username you wish to use as your main."
  echo "Otherwise 'admin' is a good choice. You can also have a separate 'admin' and personal account as well."
  read ADMIN_USER
  echo
  echo Do you wish to support Bluesky?
  echo Enter 'Y' for yes
  read BLUESKY_SUPPORT

  if [[ $BLUESKY_SUPPORT =~ ^[Yy]$ ]]; then
    echo
    echo "Please enter your bluesky domain."
    echo "This needs to be different from your wafrn instance, for example bsky.example.com"
    echo "Make sure you point both <domain> AND *.<domain> to this server"
    read PDS_DOMAIN_NAME
    echo
    echo "Please enter the handle for your admin user. Your user will then be available at @<username>.bsky.example.com"
    echo "Note: there are some limitations on what is supported and there are a lot of reserved words you cannot use, like 'admin'"
    echo "Check the following site for a full list: https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/handle/reserved.ts"
    echo "If unsure enter 'wafrnadmin'"
    read PDS_ADMIN_USERNAME
  fi

  echo
  echo Do you wish to send emails? This mainly includes invites and reset password requests.
  echo "Note: You should have emails enabled unless you are doing a single-user instance, otherwise people won't be able to reset their password properly"
  echo Enter 'Y' for yes
  read EMAIL_SUPPORT

  if [[ $EMAIL_SUPPORT =~ ^[Yy]$ ]]; then
    echo
    echo "Did you read the manual? We need a SMTP server config in this case"
    echo
    echo "Tell us the SMTP host"
    read SMTP_HOST
    echo
    echo "Tell us the SMTP port. E.g. 587"
    read SMTP_PORT
    echo
    echo "We need the SMTP username"
    read SMTP_USER
    echo
    echo "Tell us the SMTP user password"
    read SMTP_PASSWORD
    echo
    echo "We need the email address that will send the emails, e.g wafrn@example.com"
    read SMTP_FROM
    echo
    echo "Do you want to send welcome emails to users needing approval?"
    echo "While it's a nice thing to do, this might allow attackers to spam people through you, and therefore you can get blocked by your SMTP provider"
    echo Enter 'Y' for yes
    read SEND_ACTIVATION_MAIL
  fi

  echo Please select from the following packages:
  echo "1: Minimum install (default); Runs the bare minimum to get Wafrn running"
  echo "2: Monitoring support; Minimum install with added Grafana to monitor your instance"
  echo "3: Advanced install; More advanced config, with separate workers to handle the load. Preferred options for larger instances."
  echo "4: Advanced install with monitoring support; The full package: advanced install plus Grafana support"

  read INSTALL_TYPE

  echo
  echo
  echo "--------------------------------------------"
  echo "Ok that was all. Let's get the party started"
  echo "--------------------------------------------"
fi

export DOCKER_COMPOSE_FILENAME=docker-compose.simple.yml

if [[ $INSTALL_TYPE == "2" ]]; then
  export DOCKER_COMPOSE_FILENAME=docker-compose.simple.metrics.yml
fi

if [[ $INSTALL_TYPE == "3" ]]; then
  export DOCKER_COMPOSE_FILENAME=docker-compose.advanced.yml
fi

if [[ $INSTALL_TYPE == "4" ]]; then
  export DOCKER_COMPOSE_FILENAME=docker-compose.advanced.metrics.yml
fi

if [[ ! $BLUESKY_SUPPORT =~ ^[Yy]$ ]]; then
  export COMPOSE_PROFILES=default
  export PDS_DOMAIN_NAME=bsky.example.com
fi

if [[ $EMAIL_SUPPORT =~ ^[Yy]$ ]]; then
  if [[ ! $SEND_ACTIVATION_MAIL =~ ^[Yy]$ ]]; then
    export DISABLE_REQUIRE_SEND_EMAIL=true
  fi
else
  export DISABLE_REQUIRE_SEND_EMAIL=true
fi


export DOMAIN_NAME PDS_DOMAIN_NAME ADMIN_EMAIL ADMIN_USER SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASSWORD SMTP_FROM BLUESKY_SUPPORT

export CACHE_DOMAIN=cdn.${DOMAIN_NAME}
export MEDIA_DOMAIN=media.${DOMAIN_NAME}
export ACME_EMAIL=${ADMIN_EMAIL}
export FRONTEND_MEDIA_URL=https://${MEDIA_DOMAIN}
export FRONTEND_CACHE_URL=https://${CACHE_DOMAIN}/api/cache?media=

echo
echo "-------------------"
echo "Installing packages"
echo "-------------------"

sudo apt update
sudo apt install -y git postgresql-client curl lsb-release wget build-essential sudo jq xxd

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
git clone https://codeberg.org/wafrn/wafrn
cd wafrn

echo
echo "---------------------"
echo "Setting up the config"
echo "---------------------"

source install/env_secret_setup.sh
cp $DOCKER_COMPOSE_FILENAME docker-compose.yml

echo
echo "--------------------------"
echo "Building and starting apps"
echo "--------------------------"
docker compose build
docker compose up -d

case $BLUESKY_SUPPORT in
  Y|y)
    echo
    echo "--------------------------"
    echo "Setting up Bluesky support"
    echo "--------------------------"

    ./install/bsky/create-admin.sh $PDS_ADMIN_USERNAME
    ./install/bsky/add-insert-code.sh
    sed -i 's/ENABLE_BSKY=.*/ENABLE_BSKY=true/' .env
    docker compose build
    docker compose up -d
  ;;
esac

POST_DOCKER

echo "------------------"
echo "Setting up backups"
echo "------------------"

cat <<CROND_FILE | sudo tee /etc/cron.d/wafrn-backup
22 3 * * * $(whoami) $HOME/wafrn/install/manage.sh backup
CROND_FILE

echo "-------------------------"
echo "Setting up cache cleanups"
echo "-------------------------"

cat <<CROND_FILE | sudo tee /etc/cron.d/wafrn-cleanup
22 4 * * * $(whoami) $HOME/wafrn/install/manage.sh clean
CROND_FILE

echo
echo "----"
echo "Done"
echo "----"

source $HOME/wafrn/.env

echo "Well done. The database user and password have been introduced in the config file over at '~/wafrn/.env'"
echo
echo "You can log in at https://${DOMAIN_NAME} with the email '${ADMIN_EMAIL}' and the password '${ADMIN_PASSWORD}'"
echo
echo "For the Bluesky integration to work make sure to read the docs on what to do as next steps."
echo "Before doing any activity however it is **highly** advised to log out and log back in to the shell"

if [[ $INSTALL_TYPE =~ ^[24]$ ]]; then
  echo
  echo "For monitoring please go to https://monitoring.${DOMAIN_NAME} with username 'admin' and password '${GF_SECURITY_ADMIN_PASSWORD}'"
fi
