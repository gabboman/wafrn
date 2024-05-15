export const config = {
    // the script would create the base config
    dbConnectionString: "mariadb://DBUSER:DBPASSWORD@127.0.0.1/DBNAME",
    domain: "DOMAINNAME",
    emailConfig: {
        host: 'smtp_host',
        port: 25,
        auth: {
          user: 'user',
          pass: 'password',
          from: 'from_mail'
        }
      },
    singleDomain: true
}