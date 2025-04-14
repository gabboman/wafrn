#!/bin/bash
# ATTENTION FORTNITE GAMER! THIS SCRIPT NEEDS TO BE RUN AS ROOT
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi
echo "Remember, this script is made for DEBIAN 12. It will install POSTGRESQL and some other extras"
echo "Please write the domain name of your wafrn instance. Make sure you have the domain pointing to this server too"
read DOMAIN_NAME
echo "Please introduce the port for the wafrn process to listen. If you are not sure, write 3000"
read PORT
echo "Ok now we need your email for the admin mail"
read ADMIN_EMAIL
echo "What do you want the admin account to be called?"
read ADMIN_USER
echo "Did you read the manual? We need a SMTP server config"
echo "Tell us the smtp host"
read SMTP_HOST
echo "Tell us the smtp port"
read SMTP_PORT
echo "We need the user"
read SMTP_USER
echo "Introduce the SMTP user password"
read SMTP_PASSWORD
echo "We need the address that will send the emails"
read SMTP_FROM
echo "ok we are almost there!"
echo "We will create a new user for wafrn and will clone the repo there. Write the user name. We recommend wafrn. YOU NEED TO REMEMBER THE PASSWORD YOU SET"
read wafrnUser
USERNAME=${wafrnUser//[^a-zA-Z0-9]/_}
echo "We are going to create the user. Set a password (wont be displayed)"
adduser $USERNAME
chmod 755 --recursive /home/${USERNAME}
read -p "Ok that's all the data we need. Lets go!"

export DOMAIN_NAME PORT ADMIN_EMAIL ADMIN_USER SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASSWORD SMTP_FROM USERNAME

apt update
apt dist-upgrade -y
apt install -y git postgresql curl lsb-release wget dialog apache2 certbot python3-certbot-apache build-essential redis ffmpeg webp graphicsmagick tmux sudo

a2enmod proxy
a2enmod proxy_http
a2enmod headers
a2enmod rewrite
systemctl restart apache2

usermod -aG www-data ${USERNAME}
usermod -aG  ${USERNAME} www-data
systemctl restart apache2

# create random password
export POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr '+/' '_-')"
export POSTGRES_USER=${USERNAME//[^a-zA-Z0-9]/_}
export POSTGRES_DBNAME=${POSTGRES_USER}
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432

sudo -u postgres psql -c "CREATE DATABASE ${POSTGRES_DBNAME};"
sudo -u postgres psql -c "CREATE USER ${POSTGRES_USER} WITH ENCRYPTED PASSWORD '${POSTGRES_PASSWORD}';"
sudo -u postgres psql -c "GRANT CONNECT ON DATABASE ${POSTGRES_DBNAME} TO ${POSTGRES_USER};"
sudo -u postgres psql -c "GRANT USAGE ON SCHEMA public TO ${POSTGRES_USER};"
sudo -u postgres psql -c "GRANT pg_read_all_data TO ${POSTGRES_USER};"
sudo -u postgres psql -c "GRANT pg_write_all_data TO ${POSTGRES_USER};"

echo "Now lets clone the repo"
su - $USERNAME -c "git clone https://github.com/gabboman/wafrn.git && cd wafrn"

echo "Preparing apache config"
cp /home/${USERNAME}/wafrn/install/apache_files/siteavaiable.conf /etc/apache2/sites-available/${DOMAINNAME}.conf

perl -pi -e 's/\$\{\{([_A-Z]+):-(.*)\}\}/$ENV{$1}||$2/ge' /etc/apache2/sites-available/${DOMAIN_NAME}.conf
perl -pi -e 's/\$\{\{([_A-Z]+)\}\}/$ENV{$1}/g' /etc/apache2/sites-available/${DOMAIN_NAME}.conf

a2ensite ${DOMAIN_NAME}

systemctl restart apache2

echo "We need to enable SSL. Select the domain from the list"
certbot


echo "Preparing backend..."
export JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
export ADMIN_PASSWORD="$(openssl rand -base64 24 | tr '+/' '_-')"

su - $USERNAME -c "cd wafrn/packages/backend && cp environment.example.ts environment.ts"

perl -pi -e 's/\$\{\{([_A-Z]+):-(.*)\}\}/$ENV{$1}||$2/ge' /home/${USERNAME}/wafrn/packages/backend/environment.ts
perl -pi -e 's/\$\{\{([_A-Z]+)\}\}/$ENV{$1}/g' /home/${USERNAME}/wafrn/packages/backend/environment.ts

echo "Configuring frontend..."
su - $USERNAME -c "cd wafrn/packages/frontend/src/environments && cp environment.example.ts environment.prod.ts"

chown ${USERNAME}:${USERNAME} /home/${USERNAME}/wafrn/packages/backend/environment.ts
chown ${USERNAME}:${USERNAME} /home/${USERNAME}/wafrn/packages/frontend/src/environments/environment.prod.ts


ln -s /home/${USERNAME}/wafrn/ /var/www/

su - $USERNAME -c "cd wafrn && ./install/step-2.sh"

chown ${USERNAME}:${USERNAME} /home/${USERNAME}/wafrn/packages/backend/environment.ts

echo "Well done. The database user and password have been introduced in the config file of the repo"

echo "you can log in at https://${DOMAIN_NAME} with the email ${ADMIN_EMAIL} and the password ${ADMIN_PASSWORD}"
