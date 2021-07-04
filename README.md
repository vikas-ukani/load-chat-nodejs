# README #

This project developed for load app chatting module ( messages ) using socket implementation.

This README would normally document whatever steps are necessary to get your application up and running.

### What is this repository for? ###

* Quick summary
* Version
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###
```
git clone https://dignizant@bitbucket.org/dignizant/load-chat-nodejs.git
```

## install all node dependency  ##

```
npm install 
```

## run development server  ##
```
npm run dev
```
 
## Server Configuration For Live Project ##

 * Refer this link to live 
    https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04


 #### Install pm2 Globally
 ```
 sudo npm install pm2 -g
 ```

 #### Start Node server
 ```
 pm2 start index.js --name chat
 ```
 
 
 * https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-centos-7
  
  * To start server 
    
```
pm2 start index.js
```

  * To Stop Server
   ```
   pm2 stop index.js
   ```
   
  * To Restart Server 
   ```
   pm2 restart index.js
   ```

  * To get a list of online server
  ```
   pm2 list
   ```

  * To check running server listing
   ```
   pm2 list
   ```

  * Get All details about running server for index.js
   ```
   pm2 info index.js
   ```
 
 *  Monitor Server details ( CPU, Processes ) 
   ```
   pm2 monit
   ```
