#!/bin/bash
# ATENTION FORTNITE GAMER! THIS SCRIPT NEEDS TO BE RUN AS ROOT
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi
echo "Remember, this script is made for DEBIAN 12. It will install MYSQL and some other extras"
echo "Please write the domain name of your wafrn instance. Make sure you have the domain pointing to this server too"
read DOMAINNAME
echo "Please introduce the port for the wafrn process to listen. If you are not sure, write 3000"
read PORT
echo "Ok now we need your email for the admin mail"
read ADMINEMAIL
echo "How do you want the admin account to be called?"
read ADMINUSER
echo "Did you read the manual? We need a SMTP server config"
echo "Tell us the smtp host"
read SMTPHOST
echo "Tell us the smtp port"
read SMTPPORT
echo "We need the user"
read SMTPUSER
echo "Introduce the SMTP user password"
read SMTPPASSWORD
echo "We need the address that will send the emails"
read SMTPFROMMAIL
echo "ok we are almost there!"
echo "We will create a new user for wafrn and will clone the repo there. Write the user name. We recommend wafrn. YOU NEED TO REMEMBER THE PASSWORD YOU SET"
read wafrnUser
USERNAME=${wafrnUser//[^a-zA-Z0-9]/_}
echo "we ware going to create the user. Set a password (wont be displayed)"
adduser $USERNAME
chmod 755 --recursive /home/${USERNAME}
read -p "Ok thats all the data we need. Lets go!"
apt update
apt dist-upgrade -y
apt install -y git mariadb-server curl lsb-release wget dialog apache2 certbot python3-certbot-apache build-essential redis ffmpeg webp graphicsmagick tmux sudo

a2enmod proxy
a2enmod proxy_http
a2enmod headers
a2enmod rewrite
systemctl restart apache2
systemctl enable --now mariadb

usermod -aG www-data ${USERNAME}
usermod -aG  ${USERNAME} www-data
systemctl restart apache2

# create random password
PASSWDDB="$(openssl rand -hex 128)"
MAINDB=${USERNAME//[^a-zA-Z0-9]/_}

mysql -uroot -e "CREATE DATABASE ${MAINDB};"
mysql -uroot -e "CREATE USER ${MAINDB}@localhost IDENTIFIED BY '${PASSWDDB}';"
mysql -uroot -e "GRANT ALL PRIVILEGES ON ${MAINDB}.* TO '${MAINDB}'@'localhost';"
mysql -uroot -e "FLUSH PRIVILEGES;"


echo "Now lets clone the repo"
su - $USERNAME -c "git clone https://github.com/gabboman/wafrn.git && cd wafrn && git checkout improvedSetup"


echo "Preparing apache config"
#cp /home/${USERNAME}/wafrn/install/apache_files/conf.conf /etc/apache2/conf-available/wafrn.conf
#sed -i "s/WAFRNUSER/${USERNAME}/g" /etc/apache2/conf-available/wafrn.conf
#a2enconf wafrn
cp /home/${USERNAME}/wafrn/install/apache_files/siteavaiable.conf /etc/apache2/sites-available/${DOMAINNAME}.conf
sed -i "s/WAFRNUSER/${USERNAME}/g" /etc/apache2/sites-available/${DOMAINNAME}.conf
sed -i "s/ADMIN_EMAIL/${ADMINEMAIL}/g" /etc/apache2/sites-available/${DOMAINNAME}.conf
sed -i "s/DOMAINNAME/${DOMAINNAME}/g" /etc/apache2/sites-available/${DOMAINNAME}.conf
sed -i "s/PORT/${PORT}/g" /etc/apache2/sites-available/${DOMAINNAME}.conf

a2ensite ${DOMAINNAME}

systemctl restart apache2

echo "We need to enable SSL. Select the domain from the list"
certbot


echo "Preparing backend..."
JWTSECRET="$(openssl rand -hex 128)"
ADMINPASSWORD="$(openssl rand -hex 16)"

su - $USERNAME -c "cd wafrn/packages/backend && cp environment.example.ts environment.ts"
sed -i "s/ADMINUSER/${ADMINUSER}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/ADMINEMAIL/${ADMINEMAIL}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/ADMINPASSWORD/${ADMINPASSWORD}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/JWTSECRET/${JWTSECRET}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/DBUSER/${MAINDB}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/DBNAME/${MAINDB}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/DBPASSWORD/${PASSWDDB}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/DBPASSWORD/${PASSWDDB}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/DOMAINNAME/${DOMAINNAME}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/APPPORT/${PORT}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/SMTPHOST/${SMTPHOST}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/SMTPUSER/${SMTPUSER}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/SMTPPORT/${SMTPPORT}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/SMTPPASSWORD/${SMTPPASSWORD}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/SMTPFROM/${SMTPFROM}/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
sed -i "s/LOCATION_OF_FRONTEND_FULL_ROUTE/\/home\/${USERNAME}\/wafrn\/frontend/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts


echo "Configuring frontend..."
su - $USERNAME -c "cd wafrn/packages/frontend/src/environments && cp environment.example.ts environment.prod.ts"
sed -i "s/DOMAINNAME/${DOMAINNAME}/g" /home/${USERNAME}/wafrn/packages/frontend/src/environments/environment.prod.ts

chown ${USERNAME}:${USERNAME} /home/${USERNAME}/wafrn/packages/backend/environment.ts
chown ${USERNAME}:${USERNAME} /home/${USERNAME}/wafrn/packages/frontend/src/environments/environment.prod.ts


ln -s /home/${USERNAME}/wafrn/ /var/www/

su - $USERNAME -c "cd wafrn && ./install/step-2.sh"

sed -i "s/${ADMINPASSWORD}/DELETED_PASSWORD/g" /home/${USERNAME}/wafrn/packages/backend/environment.ts
chown ${USERNAME}:${USERNAME} /home/${USERNAME}/wafrn/packages/backend/environment.ts

echo "Well done. The database user and password have been introduced in the config file of the repo"

echo "you can log in at https://${DOMAINNAME} with the email ${ADMINEMAIL} and the password ${ADMINPASSWORD}"

