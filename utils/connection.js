/*
    IOS Chat Application All Query Helper
    @author Vikas Ukani
*/

const mysql = require("mysql");
require('dotenv').config()
class DBConnections {

    constructor(config) {
        this.connection = mysql.createConnection({
            // host: "localhost",
            // user: "root",
            // password: "",
            // database: "load",
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE,

            // database: "load-test",

            // host: "localhost",
            // user: "root",
            // password: "K9uVUpG2Te6sqQDN",
            // database: "load",
        });
    }

    query(sql, params = null) {
        try {

            return new Promise((resolve, reject) => {
                this.connection.query(sql, function (errors, result, fields) {
                    if (errors) {
                        reject(errors);
                        throw errors;
                    }
                    resolve(result);
                });
            });
        } catch (error) {
            console.log("Catch error from query => ", error);
            return false;
        }
    }
    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(errors => {
                if (errors) return reject(errors);
            })
            resolve();
        })
    }
}


module.exports = new DBConnections();
