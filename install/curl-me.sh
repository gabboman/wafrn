#!/bin/bash
# ATENTION FORTNITE GAMER! THIS SCRIPT NEEDS TO BE RUN AS ROOT
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi
echo "Remember, this script is made for DEBIAN 12. It will install MYSQL and some other extras"
read -p "Press enter to continue"
echo "Please write the domain name of your wafrn instance. Make sure you have the domain pointing to this server too"
read DOMAINNAME
apt update
apt dist-upgrade -y
apt install -y git mariadb-server curl lsb-release wget dialog apache2 certbot python3-certbot-apache build-essential redis ffmpeg webp graphicsmagick tmux sudo

a2enmod proxy
a2enmod headers
a2enmod rewrite
systemctl restart apache2
systemctl enable mariadb

echo "We will create a new user for wafrn and will clone the repo there. Write the user name. We recommend wafrn. YOU NEED TO REMEMBER THE PASSWORD YOU SET"
read wafrnUser
USERNAME=${wafrnUser//[^a-zA-Z0-9]/_}
echo "we ware going to create the user. Set a password (wont be displayed)"
adduser $USERNAME
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
# REMOVE THE IMPROVED SETUP THING WHEN FINISHED
su - $USERNAME -c "git clone https://github.com/gabboman/wafrn.git && cd wafrn && git checkout improvedSetup && ./install/step-2.sh"
su - $USERNAME -c "cd wafrn && cp config.example.ts config.ts"
sed -i "s/DBUSER/${MAINDB}/g" /home/${USERNAME}/wafrn/config.ts
sed -i "s/DBNAME/${MAINDB}/g" /home/${USERNAME}/wafrn/config.ts
sed -i "s/DBPASSWORD/${PASSWDDB}/g" /home/${USERNAME}/wafrn/config.ts
sed -i "s/DBPASSWORD/${PASSWDDB}/g" /home/${USERNAME}/wafrn/config.ts
sed -i "s/DOMAINNAME/${DOMAINNAME}/g" /home/${USERNAME}/wafrn/config.ts

chown ${USERNAME}:${USERNAME} /home/${USERNAME}/wafrn/config.ts


echo "Well done. The database user and password have been introduced in the config file of the repo"



