/*
    IOS Chat Application All Query Helper
    @author Vikas Ukani
*/

'use-strict';
const moment = require('moment');
const Database = require('./connection');
const _ = require('underscore');

/**
 * Query Helper  All Queries defined here.. regarding messages
 */
class QueryHelper {

    constructor(app) {
        this.database = Database;
    }

    async userNameCheck(name) {
        return await this.database.query(`SELECT count(name) as count FROM users WHERE LOWER(name) = ?`, `${name}`);
    }

    /** get active user with id wise  */
    async getActiveUser(id) {
        try {
            var query = "SELECT `id`,`name`,`is_active`,`is_online` from users WHERE `id` = " + id + " AND `is_active` = 1"
            const result = await this.database.query(query);
            // const result = await this.database.query(`SELECT id,name,is_active,is_online from users WHERE id = ? AND is_active = ?`, [id, true]);
            if (result !== null) {
                return result[0];
                return result[0]['name'];
            } else {
                return null;
            }
        } catch (error) {
            console.warn("Catch Error from getActiveUser =>", error);
            return null;
        }
    }

    /** set message to read set with receiver id  */
    async setReadMessage(id) {
        try {
            var query = "UPDATE `message_conversation` SET `unread_count` = 0 WHERE `id` = " + id  /* + "" */;
            return await this.database.query(query);
            // "UPDATE messages SET `is_read` = 1 where `to_id` = '" + id + "'"
        } catch (error) {
            console.warn("Catch error from setReadMessage => ", error);
            return null;
        }
    }

    /** check user is online or not */
    async checkUserOnline(id) {
        try {
            var query = " SELECT  `id`, `is_online` from `users` WHERE `id` = " + id + " AND `is_online` = 1 ";
            return await this.database.query(query);
        } catch (error) {
            console.warn("Catch Error from query Promise -=> ", errors);
            return false;
        }
    }

    /** get all conversation using id */
    async getConversationList(id) {
        try {
            let query = "SELECT c.* "
                + ", u.id as 'from_user_id', u.name as 'from_name', u.photo as 'from_photo' "
                + ", ut.id as 'to_user_id', ut.name as 'to_name', ut.photo as 'to_photo' "
                + " FROM `message_conversation` c "
                + " JOIN `users` u ON u.id = c.from_id  "
                + " JOIN `users` ut ON ut.id = c.to_id  "
                + " WHERE "
                + " `from_id` = " + id + " "
                + " OR "
                + " `to_id` = " + id + " ";
            return await this.database.query(query);

        } catch (error) {
            console.warn("Catch Error from query Promise -=> ", errors);
            return false;
        }
    }

    /** get all messages for active users using socket id wise */
    async getChatList(id, pageination = { limit: 10 }) {
        try {
            let query = "SELECT * FROM ";
            query += "`messages` WHERE ";
            query += " `conversation_id` = ";
            query += id;
            /** if send id then select only greater then the id records */
            if (pageination && pageination.id && pageination.id > 1) {
                query += " AND ";
                query += " `id` < " + pageination.id + " ";
            }
            query += " ORDER BY `created_at` DESC ";
            if (pageination && pageination.limit) {
                // var start = ((parseInt(pageination.page) - 1) * parseInt(pageination.limit));
                var limit = parseInt(pageination.limit)
                query += " LIMIT "
                    + " 0 , "
                    + limit;
            }
            return await this.database.query(query);
        } catch (error) {
            console.warn("Catch Error from query getChatList -=> ", errors);
            return false;
        }
    }

    /** set socket_id to users */
    async addSocketId(id, socketId) {
        try {
            var query = "UPDATE users SET `socket_id` = '" + socketId + "', `is_online` = 1  WHERE `id` = " + id;
            await this.database.query(query);
            query = "SELECT * FROM users WHERE `id` = " + id;
            return await this.database.query(query);
        } catch (error) {
            console.log("Catch Error from addSocketId => ", error);
            return null;
        }
    }

    /** get socket id from users by user id */
    async getSocketIdByUserId(id) {
        try {
            var query = " SELECT `socket_id` FROM `users` WHERE  `id` = " + id + " AND `is_online` = 1 LIMIT 0, 1  ";
            return await this.database.query(query);
        } catch (error) {
            console.log("Catch Error from getSocketIdByUserId => ", error);
            return null;
        }
    }

    /** to remove socket id from users table  */
    async logoutUser(userSocketId) {
        var query = "UPDATE `users` SET `socket_id` = '', `is_online` = 0  WHERE  `socket_id` = '" + userSocketId + "'";
        return await this.database.query(query);
        // return await this.database.query(`UPDATE users SET socketid = ?, online= ? WHERE socketid = ?`, ['', 'N', userSocketId]);
    }

    /** check user is logout or not  */
    async isUserLoggedOut(userSocketId) {
        try {
            var query = "SELECT `is_online`, `name`  FROM `users` WHERE `socket_id` = '" + userSocketId + "'";
            return await this.database.query(query);
        } catch (error) {
            // return await this.db.query(`SELECT online FROM users WHERE socketid = ?`, [userSocketId]);
            console.log("Catch erro from isUserLoggedOut => ", error);
            return null;
        }
    }

    /** getConversationById using from and to  */
    async getConversationById(id) {
        try {
            var query = "SELECT  c.*"
                + ", u.id as 'from_user_id', u.name as 'from_name', u.photo as 'from_photo' "
                + ", ut.id as 'to_user_id', ut.name as 'to_name', ut.photo as 'to_photo' "
                + " FROM `message_conversation` c "
                + " JOIN `users` u ON u.id = c.from_id  "
                + " JOIN `users` ut ON ut.id = c.to_id  "
                + " WHERE "
                + " c.id = '" + id + "'";
            return await this.database.query(query);
        } catch (error) {
            console.log("Catch erro from getConversationById => ", error);
            return null;
        }
    }

    /** get conversation using from and to  */
    async getConversation(data) {
        try {
            var query = "SELECT * FROM `message_conversation` "
                + " WHERE "
                + " ( "
                + " `from_id` = '" + data.from_id + "'"
                + " AND "
                + " `to_id` = '" + data.to_id + "' "
                + " ) "
                + " OR "
                + " ( "
                + " `from_id` = '" + data.to_id + "' "
                + " AND "
                + " `to_id` = '" + data.from_id + "' "
                + " ) ";
            return await this.database.query(query);
        } catch (error) {
            console.log("Catch erro from getConversation => ", error);
            return null;
        }
    }

    /** store Conversation using from and to  */
    async storeConversation(data) {
        try {
            var query = " INSERT INTO message_conversation ( `from_id`, `to_id`, `last_message`, `unread_count`, `created_at`, `updated_at` )  values "
                + " ( "
                + "'" + data.from_id + "' ,"
                + "'" + data.to_id + "' , "
                + "'" + data.last_message + "' ,"
                + "1 ,"
                + "'" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' ,"
                + "'" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "'"
                + ")";
            return await this.database.query(query);
        } catch (error) {
            console.log("Catch erro from getConversation => ", error);
            return null;
        }
    }

    /** update Conversation using from and to  */
    async updateConversation(data) {
        try {
            var query = " UPDATE message_conversation SET "
                + " `last_message` = '" + data.last_message + "' ";
            if (data.from_id) {
                query += " , `from_id` = " + data.from_id + " ";
            }
            if (data.to_id) {
                query += " , `to_id` = " + data.to_id + " ";
            }
            // if (data.last_message) {
            //     query += " , `last_message` = '" + data.last_message + "' ";
            // }
            query += " , `unread_count` = `unread_count` + " + data.unread_count + " "
                + " , `updated_at` = '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " WHERE "
                + " `id` = " + data.id + " ";

            return await this.database.query(query);
        } catch (error) {
            console.log("Catch erro from updateConversation => ", error);
            return null;
        }
    }

    /** store Conversation for event using from and to */
    async storeConversationEvent(data) {
        try {
            var query = " INSERT INTO `message_conversation` ( "
                + " `from_id`, `to_id`, `last_message`, `type`, `unread_count` ,  `event_id` , `created_at`, `updated_at` )  "
                + " VALUES "
                + " ( "
                + " " + data.from_id + " ,"
                + " " + data.to_id + " , "
                + " " + String(data.last_message) + " ,"
                + " " + data.type + " , "
                + " 1, "
                + " " + data.event_id + " ,"
                + " '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' ,"
                + " '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "'"
                + " )";
            return await this.database.query(query);
        } catch (error) {
            console.log("Catch erro from storeConversationEvents => ", error);
            return null;
        }
    }
    /** store Conversation for training log using from and to */
    async storeConversationLog(data) {
        try {
            var query = " INSERT INTO `message_conversation` ( "
                + " `from_id`, `to_id`, `last_message`, `type`, `unread_count` ,  `training_log_id` , `created_at`, `updated_at` )  "
                + " VALUES "
                + " ( "
                + " " + data.from_id + " ,"
                + " " + data.to_id + " , "
                + " " + data.last_message + " ,"
                + " 1 , "
                + " 1 , "
                + " " + data.training_log_id + " , "
                + " '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' ,"
                + " '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "'"
                + " )";
            return await this.database.query(query);
        } catch (error) {
            console.log("Catch erro from getConversation => ", error);
            return null;
        }
    }
    /** store Conversation for event using from and to */
    async updateConversationEvent(data) {
        try {
            var query = " UPDATE message_conversation SET "
                + " `last_message` = " + String(data.last_message) + " "
                + ", `from_id` = " + data.from_id + " "
                + ", `to_id` = " + data.to_id + " "
                + ", `event_id` = " + data.event_id + " "
                + ", `unread_count` = `unread_count` + 1 " // '" + data.unread_count + "'
                + ", `updated_at` = '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " WHERE "
                + " `id` = '" + data.id + "' ";
            return await this.database.query(query);
        } catch (error) {
            console.log("Catch erro from getConversation => ", error);
            return null;
        }
    }
    /** store Conversation for event using from and to */
    async updateConversationLog(data) {
        try {
            var query = " UPDATE message_conversation SET "
                + " `last_message` = " + String(data.last_message) + " "
                + ", `from_id` = " + data.from_id + " "
                + ", `to_id` = " + data.to_id + " "
                + ", `training_log_id` = " + data.training_log_id + " "
                + ", `unread_count` = `unread_count` + 1 " // '" + data.unread_count + "'
                + ", `updated_at` = '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " WHERE "
                + " `id` = '" + data.id + "' ";
            return await this.database.query(query);
        } catch (error) {
            console.log("Catch erro from getConversation => ", error);
            return null;
        }
    }
    /** 
     * send nessage to database  
     */
    async sendMessagesEvent(input) {
        try {
            // , `created_at`, `updated_at`
            var query = " INSERT INTO `messages` "
                + "( `conversation_id`, `from_id`, `to_id`, `message`, `event_id` , `created_at`, `updated_at`) "
                + " VALUES "
                + " ( "
                + " '" + input.conversation_id + "' "
                + " , " + input.from_id + " "
                + " , " + input.to_id + " "
                + " , " + String(input.message) + " "
                + " , " + input.event_id + " "
                + " , '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " , '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " ) ";

            return await this.database.query(query);
        } catch (error) {
            console.warn("Catch error from sendMessagesEvent => ", error);
            return null;
        }
    }

    /** 
     * send nessage to database  
     */
    async sendMessagesLog(input) {
        try {
            // , `created_at`, `updated_at`
            var query = " INSERT INTO `messages` "
                + "( `conversation_id`, `from_id`, `to_id`,  `training_log_id` , `created_at`, `updated_at` ) "
                + " VALUES "
                + " ( "
                + " '" + input.conversation_id + "' "
                + " , " + input.from_id + " "
                + " , " + input.to_id + " "
                + " , " + input.training_log_id + " "
                + " , '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " , '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " ) ";
            return await this.database.query(query);
        } catch (error) {
            console.warn("Catch error from sendMessages => ", error);
            return null;
        }
    }

    /** get an message using sender id and recevier id */
    async getMessages(userId, toUserId) {
        try {
            return await this.database.query(
                `SELECT id, from_id as senderId, to_id as receiverId, message FROM message WHERE
                (to_id = ? AND to_user_id = ? )
            OR
                (to_id = ? AND to_user_id = ? )	ORDER BY id ASC
                    `, [userId, toUserId, toUserId, userId]
            );
        } catch (error) {
            console.warn("Catch error from getMessages => ", error);
            return null;
        }
    }

    /** get message by id */
    async getMessagesById(id) {
        try {
            var query = "SELECT * FROM `messages` "
                + " WHERE "
                + " `id` = " + id
                ;

            console.log("MEssage Quyer ", query);
            return await this.database.query(query);
        } catch (error) {
            console.warn("Catch error from getMessagesById => ", error);
            return null;
        }
    }

    /** 
     * send nessage to database  
     */
    async sendMessages(input) {
        try {
            // , `created_at`, `updated_at`
            var query = " INSERT INTO `messages` ( `conversation_id`,  `from_id`, `to_id`, `message`, `created_at`, `updated_at` )  "
                + " VALUES "
                + " ( "
                + " '" + input.conversation_id + "' "
                + " , '" + input.from_id + "' "
                + " , '" + input.to_id + "' "
                + " , '" + input.message + "' "
                + " , '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " , '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " ) ";
            // + ", NOW() ,"
            // + ", NOW()" 
            return await this.database.query(query);
        } catch (error) {
            console.warn("Catch error from sendMessages => ", error);
            return null;
        }
    }

    /** get a message for send to receiver user */
    async getDetailById(id) {
        try {
            return await this.database.query(
                "SELECT * FROM `messages` WHERE `id` = '" + id + "' LIMIT 0, 1"
            );
        } catch (error) {
            console.warn("Catch error from getDetailById => ", error);
            return null;
        }
    }

    /** get a message for send to receiver user */
    async getClientBookedData(id) {
        try {
            return await this.database.query(
                "SELECT m.id, m.conversation_id, m.booked_client_id, "
                + " b.from_id, b.to_id, b.selected_date, b.available_time_id, b.notes, b.confirmed_status"
                + " FROM "
                + " `messages` m JOIN `booked_clients` b "
                + " WHERE m.booked_client_id = b.id "
                + " AND "
                + " `id` = '" + id + "' LIMIT 0, 1"
            );
        } catch (error) {
            console.warn("Catch error from getDetailById => ", error);
            return null;
        }
    }


    /** get a message for send to receiver user */
    async getMessage(id, receiveId) {
        try {
            return await this.database.query(
                `SELECT id, from_id as senderId, to_id as receiveId, message FROM messages WHERE
                (senderId = ? AND receiveId = ? )
            OR
                (senderId = ? AND receiveId = ? ) ORDER BY id ASC
                    `, [id, receiveId, receiveId, id]
            );
        } catch (error) {
            console.warn("Catch error from getMessage => ", error);
            return null;
        }
    }

    /** get training details by id  */
    async getTrainingLogDetailById(id) {
        try {

            let query = "SELECT * FROM `training_logs` ";
            query += " WHERE ";
            query += " `id` = '" + id + "'";
            return await this.database.query(query);
        } catch (error) {
            console.error("Catch error from getTrainingLogDetailById", error);
        }
    }

    /** get traiing activity details by id */
    getTrainingActivityDetailById(id) {
        try {
            let query = "SELECT * FROM `training_activity` ";
            query += " WHERE ";
            query += " `id` = '" + id + "'";
            return this.database.query(query);
        } catch (error) {
            console.error("Catch error from getTrainingLogDetailById", error);
        }
    }

    async getEventDetailsById(id) {
        try {
            let query = "SELECT `id` , `event_name`, `event_image`,  `date_time`, `duration`, `event_price`, `description`  FROM `load_center_events` ";
            query += " WHERE ";
            query += " `id` = " + id + "";

            return await this.database.query(query);

        } catch (error) {
            console.error("Catch error from getEventDetailsById", error)
        }
    }

    /** get client booking details by id */
    async getClientBookingDetailsById(id) {
        try {
            let query = "SELECT "
                + " b.id,  b.selected_date, b.available_time_id, b.confirmed_status, a.name, a.is_active "
                + " FROM `booked_clients` b "
                + " JOIN `available_times` a ON a.id = b.available_time_id "
            query += " WHERE ";
            query += " b.id = " + id;
            return await this.database.query(query);
        } catch (error) {
            console.error("Catch error from getEventDetailsById", error)
        }
    }


    /** get traiing activity details by id */
    async getTrainingIntencityDetailsById(id) {
        try {
            let query = "SELECT * FROM `training_intensity` ";
            query += " WHERE ";
            query += " `id` = '" + id + "'";
            return await this.database.query(query);
        } catch (error) {
            console.error("Catch error from getTrainingIntencityDetailsById", error);

        }
    }

    /** get traiing goal details by id */
    async getTrainingGoalDetailsById(id) {
        try {
            let query = "SELECT * FROM `training_goal` ";
            query += " WHERE ";
            query += " `id` = '" + id + "'";
            return await this.database.query(query);
        } catch (error) {
            console.error("Catch error from getTrainingGoalDetailsById", error);
        }
    }

    /**
     * Get booked client details using id 
     * @param {id} id => booked client record id
     */
    async getBookedClientDetailsById(id) {
        try {
            let query = "SELECT * FROM `booked_clients` ";
            query += " WHERE ";
            query += " `id` = '" + id + "'";
            return await this.database.query(query);
        } catch (error) {
            console.error("Catch error from getBookedClientDetailsById => ", error);
        }
    }

    async storeClintBookingConversationMessage(input) {
        try {
            let query = " INSERT INTO `message_conversation` ( `from_id` , `to_id`, `last_message`, `type`, `booked_client_id` , `unread_count` ,  `created_at`, `updated_at` ) "
                + " VALUES "
                + " ( "
                + input.from_id
                + " , " + input.to_id
                + " , '" + (input.last_message).toString() + "' "
                + " , " + input.type
                + " , " + input.booked_client_id
                + " , " + input.unread_count
                + " , '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " , '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " ) ";
            return await this.database.query(query);
        } catch (error) {
            console.error("Catch error from storeClintBookingConversationMessage => ", error);
        }
    }
    async updateClintBookingConversationMessage(input, id) {
        try {
            let query = " UPDATE `message_conversation` SET "
                + " `from_id` =" + input.from_id + " "
                + ", `to_id` =" + input.to_id + " "
                + ", `last_message` = '" + input.last_message + "' "
                + ", `type` = " + input.type + " "
                + ", `booked_client_id` = " + input.booked_client_id + " "
                + ", `updated_at` = '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "'"
                + " WHERE `id` = " + id;
            return await this.database.query(query);
        } catch (error) {
            console.error("Catch error from updateClintBookingConversationMessage => ", error);
        }
    }

    async storeClintBookingMessage(input) {
        try {
            let query = " INSERT INTO `messages` ( `conversation_id`, `from_id` ,`to_id`, `booked_client_id`, `created_at`, `updated_at` ) "
                + " VALUES "
                + " ( "
                + input.conversation_id
                + " , " + input.from_id + " "
                + " , " + input.to_id + " "
                + " , " + input.booked_client_id + " "
                + " , '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " , '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "' "
                + " ) ";
            return await this.database.query(query);
        } catch (error) {
            console.error("Catch error from getBookedClientDetailsById => ", error);
        }
    }


    /** UPDATE client booking confirm status  */
    async updateClientBookingStatusById(data) {
        try {
            let query = "UPDATE `booked_clients` SET "
                + " `confirmed_status` =  " + data.confirmed_status
                + ", `updated_at` = '" + moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + "'  "
                + " WHERE "
                + " `id` = " + data.id;
            // console.log("Update Query ", query);
            return await this.database.query(query);
        } catch (error) {
            console.error("Catch error from getBookedClientDetailsById => ", error);
        }
    }

}

module.exports = new QueryHelper();