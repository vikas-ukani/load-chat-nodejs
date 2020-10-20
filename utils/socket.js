/* 
    IOS Chat Application Socket events
    @author Vikas Ukani
*/
'use-strict';
const queryHelper = require('./query-helpers');
const _ = require('underscore');

class Socet {
    constructor(socket) {
        this.io = socket;
        this.user_id = null;
    }

    /** get all conversation by details */
    async getAllConversationByDetail(data) {
        let conversation = await queryHelper.getConversation(data);
        return (conversation && conversation.length) ? conversation : null;
    }

    /** store message to message table */
    async sendMessage(data) {
        try {
            const sqlResult = await queryHelper.sendMessages(data);
            let getMessage = await queryHelper.getDetailById(sqlResult.insertId); // sqlResult.insertId
            return getMessage;
            // console.log("getMessage", getMessage);
        } catch (error) {
            console.log("Catch error in sendMessage", error);
            return null
        }
    }

    /** get training activity details by id */
    async getTrainingActivityDetailsById(id) {
        let returnTrainingLogData = null;
        if (id) {
            const activityDetail = await queryHelper.getTrainingActivityDetailById(id);
            if (activityDetail && activityDetail.length) {
                returnTrainingLogData = _.first(activityDetail);
                return returnTrainingLogData;
            }
        } else {
            return returnTrainingLogData;
        }
    }

    /** Get detail of Training intencity by id */
    async getTrainingIntencityById(id) {
        let returnTrainingIntencity = null;
        if (id) {
            let intencities = await queryHelper.getTrainingIntencityDetailsById(id);
            if (intencities && intencities.length) {
                returnTrainingIntencity = _.first(intencities);
                return returnTrainingIntencity;
            }
        } else {
            return returnTrainingIntencity;
        }
        return null;
        try {
            let returnTrainingIntencity = null;
            if (id) {
                let intencities = await queryHelper.getTrainingIntencityDetailsById(id);
                if (intencities && intencities.length) {
                    returnTrainingIntencity = _.first(intencities);
                    return returnTrainingIntencity;
                }
            } else {
                return returnTrainingIntencity;
            }
        } catch (error) {
            console.error("Error in getTrainingIntencityById", error);
        }
    }

    /** Get detail of Training goal by id */
    async getTrainingGoalById(id) {
        try {
            let returnTrainingGoal = null;
            if (id) {
                let goals = await queryHelper.getTrainingGoalDetailsById(id);
                if (goals && goals.length) {
                    returnTrainingGoal = _.first(goals);
                    return returnTrainingGoal;
                }
            } else {
                return returnTrainingGoal;
            }
        } catch (error) {
            console.error("Error in getTrainingIntencityById", error);
        }
    }

    /** update training message */
    async getTrainingLogDetailsCopy(data) {
        let returnTrainingLogData = {};
        if (data && data.training_log_id && data.training_log_id > 0) {
            data.type = 1 // set type to 1 for training
            let details = await queryHelper.getTrainingLogDetailById(data.training_log_id);
            if (details && details.length) {
                let detail = _.first(details);
                returnTrainingLogData.name = detail.workout_name;
                if (detail.training_activity_id) {
                    /** for  get training log event image icon_path */
                    let trainingActivity = await this.getTrainingActivityDetailsById(detail.training_activity_id);
                    if (trainingActivity) {
                        returnTrainingLogData.icon_path = trainingActivity.icon_path;
                    }
                }

                returnTrainingLogData.data = [];
                /** set training intencity name in data */
                if (detail.training_intensity_id) {
                    let intencity = await this.getTrainingIntencityById(detail.training_intensity_id);
                    if (intencity && intencity.name) {
                        let data = {
                            name: "Intencity",
                            value: intencity.name
                        }
                        returnTrainingLogData.data.push(data);
                    }
                }

                /** set training goal name in data */
                if (detail.training_goal_id) {
                    let goal = await this.getTrainingGoalById(detail.training_goal_id);
                    if (goal && goal.name) {
                        let data = {
                            name: "Training Goal",
                            value: goal.name
                        }
                        returnTrainingLogData.data.push(data);
                    }
                }
            }
            return returnTrainingLogData;
        } else {
            return returnTrainingLogData;
        }
    }

    /** socket configuration */
    socketConfig() {
        /** socket middleware call before access socket event */
        this.io.use(async (socket, next) => {
            let id = socket.request._query['id'];
            this.user_id = id;
            /** store user id in common array */
            let userSocketId = socket.id;
            const response = await queryHelper.addSocketId(id, userSocketId);

            if (response && response !== null) {
                next();
            } else {
                console.error(`Socket connection failed, for  user Id ${id}.`);
                return;
            }
        });
        this.socketEvents();
    }

    /**
     *  Set sockets events 
     */
    socketEvents() {
        this.io.on('connection', (socket) => {
            let connectedResponse = {
                status: 1,
                id: this.user_id,
                message: "ONLINE"
            }
            console.log("Connected ", connectedResponse);
            this.io.emit('check-status', connectedResponse);
            socket.on('is-user-online', async (userId) => {
                let users = await queryHelper.checkUserOnline(userId);
                let response = {
                    id: parseInt(userId),
                    status: 0,
                    message: "OFFLINE"
                }
                if (users && users.length >= 1 && users[0].is_online && users[0].is_online == 1) {
                    // console.log("Online ", users[0].is_online);
                    response.status = 1;
                    response.message = "ONLINE";
                }
                this.io.emit('check-status', response);
            });

            /** get the user's Chat list */
            socket.on('conversation-list', async (userId) => {
                let conversationListResponse = {};

                if (userId === '' && (typeof userId !== 'string' || typeof userId !== 'number')) {
                    // console.log("socketEvents => true conditions ");
                    conversationListResponse.success = false;
                    conversationListResponse.message = `User does not exits.`;
                    this.io.emit('conversation-list-response', conversationListResponse);
                } else {
                    try {
                        /** get current user and other online user */
                        const conversationList = await queryHelper.getConversationList(userId)
                        // const result = await queryHelper.getConversationList(userId, socket.id);
                        this.io.to(socket.id).emit('conversation-list-response', {
                            data: (conversationList && conversationList.length) ? conversationList : null,
                            success: (conversationList && conversationList.length) ? true : false,
                            message: "Conversation details retrives.",
                            // singleUser: false,
                            // conversationList: result.conversation_detail,
                        });
                        // socket.broadcast.emit('conversation-list-response', {
                        //     data: (conversationList && conversationList.length) ? conversationList : null,
                        //     success: (conversationList && conversationList.length) ? true : false,
                        //     message: "Conversation details retrives.",
                        //     // singleUser: false,
                        //     // conversationList: result.conversation_detail,
                        // });
                    } catch (error) {
                        console.warn("Catch error from conversation-list socket => ", error);
                        return null;
                    }
                }
            });

            /** get the user's Chat list */
            socket.on(`chat-list`, async (conversationId, input = null) => {
                let chatListResponse = {};
                if (conversationId === '' && (typeof conversationId !== 'string' || typeof conversationId !== 'number')) {
                    chatListResponse.success = false;
                    chatListResponse.message = `User does not exits.`;
                    this.io.emit('chat-list-response', chatListResponse);
                } else {
                    try {
                        /** get current user and other online user */
                        var chatList = await queryHelper.getChatList(conversationId, input)
                        chatList.map((list) => {
                            if (list.training_log_id != null) {
                                list.type = 1;
                            } else if (list.event_id != null) {
                                list.type = 2;
                            } else if (list.booked_client_id != null) {
                                list.type = 3;
                            } else {
                                list.type = 0;
                            }
                        })
                        /** return a message */
                        this.io.to(socket.id).emit('chat-list-response', {
                            data: (chatList && chatList.length) ? chatList : null,
                            success: (chatList && chatList.length) ? true : false,
                            message: "chat list details retrives.",
                        });

                    } catch (error) {
                        console.warn("Catch error from conversation-list socket => ", error);
                        return null;
                    }
                }
            });

            /** get training details */
            socket.on(`get-training-details`, async function (id, fn) {
                var response = {}
                var details = await queryHelper.getTrainingLogDetailById(id);
                if (details && details.length) {
                    details = _.first(details);
                    if (details) {
                        response.name = (details.workout_name) ? details.workout_name : '';
                    }

                    /** get training activity */
                    if (details.training_activity_id) {
                        let trainingActivity = await queryHelper.getTrainingActivityDetailById(details.training_activity_id);
                        trainingActivity = _.first(trainingActivity);
                        if (trainingActivity) {
                            response.icon_path = (trainingActivity.icon_path && trainingActivity.icon_path.length) ? trainingActivity.icon_path : '';
                        }
                    }
                    response.data = [];
                    /** set training intensity details */
                    if (details.training_intensity_id) {
                        let intencity = await queryHelper.getTrainingIntencityDetailsById(details.training_intensity_id);
                        intencity = _.first(intencity);

                        if (intencity && intencity.name) {
                            let data = {
                                name: "Intencity",
                                value: intencity.name
                            }
                            response.data.push(data);
                        }
                    }

                    /** set training goal name in data */
                    if (details.training_goal_id) {
                        let goals = await queryHelper.getTrainingGoalDetailsById(details.training_goal_id);
                        if (goals && goals.length) {
                            goals = _.first(goals);
                            if (goals && goals.name) {
                                let data = {
                                    name: "Training Goal",
                                    value: goals.name
                                }
                                response.data.push(data);
                            }
                        }
                    }
                }
                fn(response);
            })

            /** get training details  */
            socket.on(`get-event-details`, async function (id, fn) {
                var details = await queryHelper.getEventDetailsById(id);
                if (details && details.length) {
                    details = _.first(details);
                }
                fn(details);
            });

            /** to read all messages */
            socket.on(`read-message`, async (cid, uid) => {
                let conversationDetails = await queryHelper.getConversationById(cid);
                let conversationDetail = conversationDetails[0];
                if (conversationDetail && conversationDetail.from_id && conversationDetail.from_id !== uid) {
                    /** set to read all message whose recevier id is cid */
                    const sqlResult = await queryHelper.setReadMessage(cid);
                }
            })

            /**
            * send the messages to the user
            */
            socket.on(`add-message`, async (data) => {
                /** send error message to current user using this current socket id */
                if (data.message === '') {
                    this.io.to(socket.id).emit(`add-message-response`, `Message cant be empty.`);
                } else if (data.from_id === '') {
                    this.io.to(socket.id).emit(`add-message-response`, `From id must be an integer value.`);
                } else if (data.conversation_id === '') {
                    this.io.to(socket.id).emit(`add-message-response`, `Conversation id required.`);
                } else if (data.to_id === '') {
                    this.io.to(socket.id).emit(`add-message-response`, `Select a user to chat.`);
                } else {
                    /** get socket id for to user  => receiver user socket id  */
                    let socket_ids = await queryHelper.getSocketIdByUserId(data.to_id);
                    let socket_id = null;
                    if (socket_ids && socket_ids.length && socket_ids[0] && socket_ids[0].socket_id) {
                        socket_id = socket_ids[0].socket_id;
                    }

                    /** UPDATE Conversation  */
                    var updateData = {
                        id: data.conversation_id,
                        from_id: data.from_id,
                        to_id: data.to_id,
                        last_message: data.message,
                        unread_count: 1  // update count
                    };
                    await queryHelper.updateConversation(updateData);

                    /** set message to message table */
                    let nMessage = await this.sendMessage({
                        conversation_id: data.conversation_id,
                        from_id: data.from_id,
                        to_id: data.to_id,
                        message: data.message
                    });
                    nMessage = _.first(nMessage);
                    nMessage.type = 0;

                    /** return to reciver user to get an message */
                    if (socket_id && socket_id.length) this.io.to(socket_id).emit(`add-message-response`, nMessage);
                    this.io.to(socket.id).emit(`add-message-response`, nMessage);
                }
            });

            /** send maltiple message to "to_ids" [3, 2, 4, 5]   */
            socket.on(`multiple-send-message`, async (data) => {
                /** check validation */
                if (data.message === '') {
                    this.io.to(socket.id).emit(` `, `Message can't be empty`);
                } else if (data.from_id === '') {
                    this.io.to(socket.id).emit(`add-message-response`, `From id must be an integer value.`);
                } else if (data.to_ids === '' || data.to_ids.length == 0) {
                    this.io.to(socket.id).emit(`add-message-response`, `Please, select users.`);
                } else {
                    /** send message for all users ids */
                    data.to_ids.forEach(async (id, i) => {
                        /** get socket id for to user  => receiver user socket id  */
                        let socket_ids = await queryHelper.getSocketIdByUserId(id);
                        let socket_id = null;
                        if (socket_ids && socket_ids.length && socket_ids[0] && socket_ids[0].socket_id) {
                            socket_id = socket_ids[0].socket_id;
                        }

                        /** check in conversion is already exists or not  IF NOT THEN create new conversasion */
                        let conversations = await this.getAllConversationByDetail({
                            from_id: data.from_id,
                            to_id: id,
                        });
                        let newMessage = {};

                        /** if conversation is zero then CREATE new conversation */
                        if (!conversations || conversations == null) {
                            /** CREATE */
                            let newConversation = await queryHelper.storeConversation({
                                from_id: data.from_id,
                                to_id: id,
                                last_message: data.message
                            });
                            /** STORE message */
                            if (newConversation && newConversation.insertId) {
                                /** set message to message table */
                                newMessage = await this.sendMessage({
                                    conversation_id: newConversation.insertId,
                                    from_id: data.from_id,
                                    to_id: id,
                                    message: data.message
                                });
                                if (newMessage && typeof newMessage == 'array') {
                                    newMessage[0].type = 0;
                                }
                                if (socket_id) this.io.to(socket_id).emit(`add-message-response`, newMessage);
                            }
                            /** TODO RETURN Conversation details */
                        } else if (conversations && conversations.length >= 1) {
                            let messages = [];
                            /** UPDATE Many Conversation */
                            conversations.forEach(async (conver, key) => {
                                /** UPDATE Conversation  */
                                let updateData = {
                                    id: conver.id,
                                    last_message: data.message,
                                    unread_count: parseInt(conver.unread_count) + 1
                                };
                                await queryHelper.updateConversation(updateData);
                                /** set message to message table */
                                let nMessage = await this.sendMessage({
                                    conversation_id: conver.id,
                                    from_id: data.from_id,
                                    to_id: id,
                                    message: data.message
                                });
                                if (nMessage && typeof nMessage === 'array') {
                                    nMessage[0].type = 0;
                                }
                                messages.push(nMessage);
                            });
                            /** RETURN a ALL message */
                            if (socket_id) this.io.to(socket_id).emit(`add-message-response`, messages);
                        }
                    });
                }
            });

            /**
            * send the log to the multiple user
            */
            socket.on(`add-log`, async (data) => {
                /** send error message to current user using this current socket id */
               /*  if (data.message === '') {
                    this.io.to(socket.id).emit(`add-log-response`, `Message cant be empty`);
                } else */ if (data.training_log_id === '') {
                    this.io.to(socket.id).emit(`add-message-response`, `Training log id must be an integer value.`);
                } else if (data.from_id === '' || data.from_id == undefined) {
                    this.io.to(socket.id).emit(`add-message-response`, `From id must be an integer value.`);
                } else if (data.to_ids === '' || data.to_ids.length === 0) {
                    this.io.to(socket.id).emit(`add-message-response`, `Please, select users.`);
                } else {
                    /** get all id wise send an */
                    _.each(data.to_ids, async (id, ket) => {
                        /** get socket id for to user  => receiver user socket id  */
                        let socket_ids = await queryHelper.getSocketIdByUserId(id);
                        let socket_id = null;
                        if (socket_ids && socket_ids.length && socket_ids[0] && socket_ids[0].socket_id) {
                            socket_id = socket_ids[0].socket_id;
                        }

                        /** check in conversion is already exists or not 
                         * IF NOT THEN create new conversasion 
                         */
                        let conversations = await this.getAllConversationByDetail({
                            from_id: data.from_id,
                            to_id: id,
                        });

                        /** check conversation is found or not */
                        if (!conversations || conversations == null) {
                            try {
                                /** create conversation data */
                                let conditions = {
                                    from_id: data.from_id,
                                    type: 1,
                                    training_log_id: data.training_log_id,
                                    to_id: id,
                                    last_message: null,
                                };
                                let newConversation = await queryHelper.storeConversationLog(conditions);
                                /** STORE message */
                                if (newConversation && newConversation.insertId) {
                                    /** create message data */
                                    let newMessage = await queryHelper.sendMessagesLog({
                                        conversation_id: newConversation.insertId,
                                        from_id: data.from_id,
                                        to_id: id,
                                        training_log_id: data.training_log_id,
                                    });
                                    if (newMessage.insertId) {
                                        newMessage = await queryHelper.getDetailById(newMessage.insertId);
                                    }
                                    newMessage = _.first(newMessage);
                                    newMessage.type = 1;
                                    // newMessage.training_log_detail = await this.getTrainingLogDetails(newMessage);

                                    /** return to reciver user to get an message */
                                    if (socket_id && socket_id.length) this.io.to(socket_id).emit(`add-message-response`, newMessage);
                                    this.io.to(socket.id).emit(`add-message-response`, newMessage);
                                }
                            } catch (error) {
                                console.error("Error in Conversation Creating", error);
                                return null;
                            }
                        } else if (conversations && conversations.length >= 1) {
                            /** update multi conversation and send message */
                            _.each(conversations, async (conversation) => {
                                let updateConversationData = {
                                    id: conversation.id,
                                    from_id: data.from_id,
                                    to_id: id,
                                    last_message: null,
                                    training_log_id: data.training_log_id,
                                }
                                await queryHelper.updateConversationLog(updateConversationData);

                                /** set message to message table */
                                let nMessage = await queryHelper.sendMessagesLog({
                                    conversation_id: conversation.id,
                                    from_id: data.from_id,
                                    to_id: id,
                                    message: null,
                                    training_log_id: data.training_log_id,
                                });
                                if (nMessage.insertId) {
                                    nMessage = await queryHelper.getDetailById(nMessage.insertId);
                                }
                                nMessage = _.first(nMessage);
                                nMessage.type = 1;
                                /** return to receiver user to get an message */
                                if (socket_id && socket_id.length) this.io.to(socket_id).emit(`add-message-response`, nMessage);
                                this.io.to(socket.id).emit(`add-message-response`, nMessage);
                            });
                        }
                    });
                }
            });

            /**
            * send the log to the multiple user
            */
            socket.on(`add-event`, async (data) => {
                /** send error message to current user using this current socket id */
                /* if (data.message === '') {
                    this.io.to(socket.id).emit(`add-message-response`, `Message cant be empty`);
                } else  */if (data.event_id === '') {
                    this.io.to(socket.id).emit(`add-message-response`, `Event id is required.`);
                } else if (data.from_id === '') {
                    this.io.to(socket.id).emit(`add-message-response`, `From id must be an integer value.`);
                } else if (data.to_ids === '' || data.to_ids.length === 0) {
                    this.io.to(socket.id).emit(`add-message-response`, `Please, select users.`);
                } else {

                    /** get all id wise send an  */
                    _.each(data.to_ids, async (id, ket) => {
                        /** get socket id for to user  => receiver user socket id  */
                        let socket_ids = await queryHelper.getSocketIdByUserId(id);
                        let socket_id = null;
                        if (socket_ids && socket_ids.length && socket_ids[0] && socket_ids[0].socket_id) {
                            socket_id = socket_ids[0].socket_id;
                        }

                        /** check in conversion is already exists or not 
                         * IF NOT THEN create new conversasion 
                         */
                        let conversations = await this.getAllConversationByDetail({
                            from_id: data.from_id,
                            to_id: id,
                        });
                        // this.io.to(socket.id).emit(`add-message-response`, conversations);

                        /** check conversation is found or not */
                        if (!conversations || conversations == null) {
                            try {
                                /** create conversation data */
                                let conditions = {
                                    from_id: data.from_id,
                                    type: 2,
                                    event_id: data.event_id,
                                    to_id: id,
                                    last_message: null,
                                };
                                let newConversation = await queryHelper.storeConversationEvent(conditions);
                                /** STORE message */
                                if (newConversation && newConversation.insertId) {
                                    /** create message data */
                                    let nMessage = await queryHelper.sendMessagesEvent({
                                        conversation_id: newConversation.insertId,
                                        from_id: data.from_id,
                                        to_id: id,
                                        message: null,
                                        event_id: data.event_id,
                                    });
                                    if (nMessage.insertId) {
                                        nMessage = await queryHelper.getDetailById(nMessage.insertId);
                                    }
                                    nMessage = _.first(nMessage);
                                    nMessage.type = 2;

                                    /** return to reciver user to get an message */
                                    if (socket_id && socket_id.length) this.io.to(socket_id).emit(`add-message-response`, newMessage);
                                    this.io.to(socket.id).emit(`add-message-response`, newMessage);
                                }
                            } catch (error) {
                                console.error("Error in Conversation Creating", error);
                                return null;
                            }
                        } else if (conversations && conversations.length >= 1) {
                            /** update multi conversation and send message */
                            _.each(conversations, async (conversation) => {
                                let updateConversationData = {
                                    id: conversation.id,
                                    from_id: data.from_id,
                                    to_id: id,
                                    last_message: null,
                                    event_id: data.event_id,
                                }
                                await queryHelper.updateConversationEvent(updateConversationData);

                                /** set message to message table */
                                let nMessage = await queryHelper.sendMessagesEvent({
                                    conversation_id: conversation.id,
                                    from_id: data.from_id,
                                    to_id: id,
                                    message: null,
                                    event_id: data.event_id,
                                });
                                if (nMessage.insertId) {
                                    nMessage = await queryHelper.getDetailById(nMessage.insertId);
                                }
                                nMessage = _.first(nMessage);
                                nMessage.type = 2;
                                /** return to receiver user to get an message */
                                if (socket_id && socket_id.length) this.io.to(socket_id).emit(`add-message-response`, nMessage);
                                this.io.to(socket.id).emit(`add-message-response`, nMessage);
                            });
                        }
                    });
                }
            });

            /** send to client booking request and notes message */
            socket.on(`add-client-request-message`, async (data, fn) => {
               /*  if (data.notes == '') {
                    this.io.to(socket.id).emit(`add-client-request-message`, `notes is required.`);
                } else */ if (data.booked_client_id === '') {
                    this.io.to(socket.id).emit(`add-client-request-message`, `booked client id is required.`);
                } else {
                    // 1. get details from booked client  id
                    var bookedClientDetail = await queryHelper.getBookedClientDetailsById(data.booked_client_id);

                    bookedClientDetail = _.first(bookedClientDetail);
                    if (!bookedClientDetail) {
                        this.io.to(socket.id).emit(`add-client-request-message`, `booked client details not found.`);
                    }

                    /** get socket id for to user  => receiver user socket id  */
                    let socket_ids = await queryHelper.getSocketIdByUserId(bookedClientDetail.to_id);
                    let socket_id = null;
                    if (socket_ids && socket_ids.length && socket_ids[0] && socket_ids[0].socket_id) {
                        socket_id = socket_ids[0].socket_id;
                    }

                    // 2. store notes on message , not in conversation message coz don't need.
                    var conversationData = {
                        from_id: bookedClientDetail.from_id,
                        to_id: bookedClientDetail.to_id,
                        last_message: (bookedClientDetail.notes).replace(/'/g, "\\'"),
                        type: 3,
                        booked_client_id: bookedClientDetail.id,
                        unread_count: 1
                    }

                    // 2.1 check for conversation already exist or not
                    let conversations = await this.getAllConversationByDetail({
                        from_id: bookedClientDetail.from_id,
                        to_id: bookedClientDetail.to_id,
                    });

                    /** first create notes converstion */
                    let conversationId = '';
                    if (conversations && conversations.length) {
                        // 2.2 if yes then update converstation details
                        /** get first conversation */
                        conversations = _.first(conversations);
                        conversationId = conversations.id;
                        await queryHelper.updateClintBookingConversationMessage(conversationData, conversations.id);
                    } else {

                        // 2.3 if not then crete new conversation records
                        let createdData = await queryHelper.storeClintBookingConversationMessage(conversationData);
                        conversationId = createdData.insertId;
                    }

                    // 3. store booked client id in messages table.
                    let messageData = {
                        conversation_id: conversationId,
                        from_id: bookedClientDetail.from_id,
                        to_id: bookedClientDetail.to_id,
                        message: bookedClientDetail.notes,
                        booked_client_id: bookedClientDetail.id
                    }

                    /** store normal text message (notes) */
                    await queryHelper.sendMessages(messageData);
                    let lastId = await queryHelper.storeClintBookingMessage(messageData);

                    // let lastMessage = await queryHelper.getClientBookedData(lastId.insertId);

                    /** 4. get conversation id and return to response  */
                    let conversationDetails = await queryHelper.getConversationById(conversationId);
                    if (conversationDetails && conversationDetails.length) {
                        conversationDetails = _.first(conversationDetails);
                    }
                    console.log("check for to user message", conversationDetails);
                    if (socket_id && socket_id.length) this.io.to(socket_id).emit(`add-client-request-message`, conversationDetails);
                    this.io.to(socket.id).emit(`add-client-request-message`, conversationDetails);
                    /** return to reciver user to get an message */
                    fn(conversationDetails);
                }
            });

            /** get last sended messages for to user. */
            socket.on(`send-message-to-receiver`, async (input) => {

                // var input = {
                //     message_id: 1,
                //     user_id: 3
                // }

                if (input.message_id == undefined || input.message_id == '') {
                    this.io.to(socket.id).emit(`add-message-response`, "message id is required.");
                } else if (input.user_id == undefined || input.user_id == '') {
                    this.io.to(socket.id).emit(`add-message-response`, "user id is required.");
                } else {

                    // 1. get message details by id
                    let messageDetails = await queryHelper.getMessagesById(input.message_id)
                    if (messageDetails) {
                        messageDetails = _.first(messageDetails);
                    } else {
                        this.io.to(socket.id).emit(`add-message-response`, "Message details not found.");
                    }

                    // 2. check for user id send to toUser id 
                    var userID = null;
                    if (messageDetails.from_id == input.user_id) {
                        userID = messageDetails.to_id;
                    } else {
                        userID = messageDetails.from_id;
                    }

                    // 2.1 get socket id by user id 
                    let socket_ids = await queryHelper.getSocketIdByUserId(userID);
                    let socket_id = null;
                    if (socket_ids && socket_ids.length && socket_ids[0] && socket_ids[0].socket_id) {
                        socket_id = socket_ids[0].socket_id;
                    }
                    // 3. send message to to user
                    if (socket_id && socket_id.length) this.io.to(socket_id).emit(`add-message-response`, messageDetails);
                }
            });

            /** get clint booking details by id using close function  */
            socket.on(`get-client-Book-details`, async function (id, fn) {
                var details = await queryHelper.getClientBookingDetailsById(id);
                if (details && details.length) {
                    details = _.first(details);
                }
                fn(details);
            });

            /** update client status to ACCEPTED or REJECTED */
            socket.on(`update-client-booking-status`, async function (input, fn) {
                /** check validation */
                if (input.status == undefined || input.status === '') {
                    fn({
                        success: false,
                        message: "Status field is require",
                        status: 400
                    });
                } else if (input.id == undefined || input.id === '') {
                    fn({
                        success: false,
                        message: "Id field is require",
                        status: 400
                    });
                } else {
                    let updatedConfirmStatus = 0;
                    if (input.status === 'ACCEPTED') {
                        updatedConfirmStatus = 1
                    } else if (input.status === 'REJECTED') {
                        updatedConfirmStatus = 2
                    }

                    /** make updated response */
                    let updatedData = {
                        confirmed_status: updatedConfirmStatus,
                        id: input.id
                    };

                    /** update status update client booking confirmed status */
                    await queryHelper.updateClientBookingStatusById(updatedData);

                    /** get client booking details */
                    let details = await queryHelper.getBookedClientDetailsById(input.id);
                    if (details && details.length) {
                        details = _.first(details);
                    }
                    fn(details);
                    /** get socket id for to user  => receiver user socket id  */
                    let socket_ids = await queryHelper.getSocketIdByUserId(details.to_id);
                    // console.log("To User Id is ", details.to_id);
                    // console.log("Socket Id is ", socket_ids);
                    // console.log("Sending Details is  ", details);

                    let socket_id = null;
                    if (socket_ids && socket_ids.length && socket_ids[0] && socket_ids[0].socket_id) {
                        socket_id = socket_ids[0].socket_id;
                        // if (socket_id && socket_id.length) this.io.to(socket_id).emit(`updated-status-response-to-receiver`, details);
                        // if (socket_id && socket_id.length) this.io.to(socket_id).emit(`add-message-response`, details);
                    }
                }
            });


            /** create event for get updated records when reciver accept or rejecte and event */
            socket.on(`receive-updated-status`, async (input) => {
                if (input.user_id == undefined) {
                    this.io.to(socket.id).emit(`updated-status-response-to-receiver`, `Id is required.`);
                } else if (input.booked_client_id == undefined) {
                    this.io.to(socket.id).emit(`updated-status-response-to-receiver`, `Id is required.`);
                } else {
                    /** get client booking details */
                    let details = await queryHelper.getBookedClientDetailsById(input.booked_client_id);
                    if (details && details.length) {
                        details = _.first(details);
                    }

                    /** GET USER ID */
                    var userID = null;
                    if (details.from_id == input.user_id) {
                        userID = details.to_id;
                    } else {
                        userID = details.from_id;
                    }

                    let socket_ids = await queryHelper.getSocketIdByUserId(userID);
                    let socket_id = null;
                    if (socket_ids && socket_ids.length && socket_ids[0] && socket_ids[0].socket_id) {
                        socket_id = socket_ids[0].socket_id;
                    }
                    console.log("User ID ", userID, socket_id);
                    this.io.to(socket.id).emit(`updated-status-response-to-receiver`, details);
                    if (socket_id && socket_id.length) this.io.to(socket_id).emit(`updated-status-response-to-receiver`, details);
                }
            });


            /**
            * Logout the user
            */
            socket.on('logout', async () => {
                const isLoggedOut = await queryHelper.logoutUser(socket.id);
                this.io.to(socket.id).emit('logout-response', {
                    error: false
                });
                socket.disconnect();
            });

            /**
            * sending the disconnected user to all socket users. 
            */
            socket.on('disconnect', async () => {
                let disConnectedResponse = {
                    id: this.user_id,
                    status: 0,
                    message: "OFFLINE"
                };
                this.io.emit('check-status', disConnectedResponse);
                await queryHelper.logoutUser(socket.id);
                socket.disconnect();
            });
        });
    }
}
module.exports = Socet; 