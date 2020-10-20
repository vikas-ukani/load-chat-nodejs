
'use strict';

const queryHelper = require('./query-helpers');
const path = require('path');
const _ = require('underscore');

class Router {
    constructor(app) {
        this.app = app;
    }

    /** add routers */
    appRoutes() {
        this.app.post('/userSessionCheck', async (request, response) => {
            const id = request.body.id;
            const sessionCheckResponse = {}
            if (id == '') {
                sessionCheckResponse.error = true;
                sessionCheckResponse.message = `User Id cant be empty.`;
                response.status(412).json(sessionCheckResponse);
            } else {
                const userDetail = await queryHelper.getActiveUser(id);

                if (userDetail === null || userDetail === '') {
                    sessionCheckResponse.error = true;
                    sessionCheckResponse.message = `User is not logged in.`;
                    response.status(401).json(sessionCheckResponse);
                } else {
                    sessionCheckResponse.error = false;
                    sessionCheckResponse.username = userDetail;
                    sessionCheckResponse.message = `User logged in.`;
                    response.status(200).json(sessionCheckResponse);
                }
            }
        });

        /** create route for get a message using id  */
        this.app.post('/getMessages', async (request, response) => {
            const senderId = request.body.from_id;
            const recevierId = request.body.recevier_id;
            const messages = {}
            if (senderId === '') {
                messages.error = true;
                messages.message = `sender id cant be empty.`;
                response.status(200).json(messages);
            } else {
                const result = await queryHelper.getMessages(senderId, recevierId);
                if (result === null) {
                    messages.error = true;
                    messages.message = `Internal Server error.`;
                    response.status(500).json(messages);
                } else {
                    messages.error = false;
                    messages.messages = result;
                    response.status(200).json(messages);
                }
            }
        });

        this.app.post('/get-chat-list', async (request, response) => {

            /** take request */
            const input = request.body;

            if (input.conversation_id === '') {
                messages.status = true;
                messages.data = null;
                messages.message = `conversation id is required.`;
                response.status(400).json(messages);
            } else {
                var chatList = await queryHelper.getChatList(input.conversation_id, input)

                // _.each(chatList, (list, index) => {
                chatList.map((list, index) => {
                    // _.each(chatList, (list, index) => {
                    var trainingObject = {};

                    if (list.training_log_id && list.training_log_id >= 1) {
                        var detail = queryHelper.getTrainingLogDetailById(list.training_log_id);
                        if (detail) {
                            trainingObject.name = (detail && detail.workout_name) ? detail.workout_name : '';

                            /** get activity icon for trininig detail */
                            if (detail.training_activity_id) {
                                var trainingActivity = queryHelper.getTrainingActivityDetailById(detail.training_activity_id);
                                if (trainingActivity) {
                                    trainingObject.icon_path = trainingActivity.icon_path;
                                }
                            }
                        }
                    }

                    list.training_log_detail = trainingObject;
                    console.log("Last Detail s", list);
                    return false


                });

                var returnData = {
                    status: true,
                    data: chatList,
                    message: `chat list retrives.`
                }
                response.status(400).json(returnData);
            }
        });


        this.app.get('*', (request, response) => {
            console.log("File Called");
            response.sendFile(path.join(__dirname + '../../client/views/index.html'));
			/*
			* OR one can define the template engine and use response.render();
			*/
        });
    }

    /** add routes */
    routesConfig() {
        this.appRoutes();
    }
}
module.exports = Router;
