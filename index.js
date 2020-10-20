'use-strict';
const express = require("express");
const http = require('http');
const io = require('socket.io');
const bodyParser = require('body-parser');

const socketEvents = require('./utils/socket');
const router = require('./utils/routes');
const config = require('./utils/routes');
// require('dotenv').config()

class Server {
    constructor() {
        this.port = process.env.PORT || 5000;
        this.host = process.env.LIVE_HOST || "192.168.0.131";
        // this.host = "localhost";
        this.app = express();
        this.http = http.Server(this.app);
        this.socket = io(this.http);

        // this.port = process.env.PORT || 5000;
        // this.host = "http://3.18.106.118";
        // //this.host = "localhost";
        // this.app = express();
        // this.http = http.Server(this.app);
        // this.socket = io(this.http);
    }

    /** use app config for use middleware */
    appConfig() {
        /** first middleware for convert json request */
        this.app.use(
            bodyParser.json()
        )
    }

    /* inject routes and socket events*/
    includeRoutes() {
        new router(this.app).routesConfig();
        new socketEvents(this.socket).socketConfig();
    }

    /** 1. main entry point */
    /* Including app and routes end-points*/
    appExecute() {
        this.appConfig();
        this.includeRoutes();
        this.http.listen(this.port, this.host, () => {
            console.log(`chat server listening on http://${this.host}:${this.port}`);
        });
    }
}
const app = new Server();
app.appExecute();
