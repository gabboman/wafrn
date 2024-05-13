#!/bin/bash
# ATENTION FORTNITE GAMER! THIS SCRIPT NEEDS TO BE RUN AS ROOT
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi
echo "Remember, this script is made for DEBIAN 12. It will install MYSQL and some other extras"
read -p "Press enter to continue"
apt update
apt dist-upgrade
apt install git curl wget apache2 certbot python3-certbot-apache build-essential redis ffmpeg webp graphicsmagick tmux sudo

a2enmod proxy
a2enmod headers
a2enmod rewrite
a2enmod mpm_worker
systemctl restart apache2


wget https://dev.mysql.com/get/mysql-apt-config_0.8.29-1_all.deb -O /root/mysql-apt-config.deb
echo "Remember, you want to use mysql 8.0"
read -p "Press enter to continue"


dpkg -i /root/mysql-apt-config.deb

apt install mysql-server

systemctl enable --now mysql

echo "Write the user that has cloned the wafrn repo"
read wafrnUser

usermod -aG www-data ${wafrnUser}
usermod -aG  ${wafrnUser} www-data
systemctl restart apache2

# create random password
PASSWDDB="$(openssl rand -base64 12)"

# replace "-" with "_" for database username
echo "Please write the name of the database. Do not use spaces nor -"
read DB_NAME
MAINDB=${DB_NAME//[^a-zA-Z0-9]/_}

    echo "Please enter root user MySQL password!"
    echo "Note: password will be hidden when typing"
    read -sp rootpasswd
    mysql -uroot -p${rootpasswd} -e "CREATE DATABASE ${MAINDB} /*\!40100 DEFAULT CHARACTER SET utf8 */;"
    mysql -uroot -p${rootpasswd} -e "CREATE USER ${MAINDB}@localhost IDENTIFIED BY '${PASSWDDB}';"
    mysql -uroot -p${rootpasswd} -e "GRANT ALL PRIVILEGES ON ${MAINDB}.* TO '${MAINDB}'@'localhost';"
    mysql -uroot -p${rootpasswd} -e "FLUSH PRIVILEGES;"

echo "Well done. The database name is ${MAINDB}, the user is ${MAINDB} and the password is: ${PASSWDDB}"
echo "Remember, write this down and next as the main wafrn user run the file step-2" 
echo "you will need the data in the step 3"

