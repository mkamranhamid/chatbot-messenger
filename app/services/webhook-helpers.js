var request = require('request');

var constants = require('../services/constants');

let { BASE_URL, ACCESS_TOKEN } = constants;
const PAGE_ACCESS_TOKEN = ACCESS_TOKEN;
var users = {};
var questions = [
    { id: 0, q: 'Hi \n\nWhats your first name?', asked: false },
    { id: 3, q: 'Whats your birth date?(make sure to answer in YYYY-MM-DD)', asked: false },
    { id: 4, q: 'Do you want to calculate the number of days?', subQ: '', asked: false, generic: true, payloadYes: 'calculate', payloadNo: 'calculate-no' }
];

function checkPreviousMessagesForTheFlow(previousMessages) {
    var sliced_questions = questions.slice();
    previousMessages.map((d, i) => {
        let bots_reply = d[1];
        let askedQuestionIndex = sliced_questions.findIndex((d) => {
            return d.q == bots_reply;
        });
        if (askedQuestionIndex == -1) return;
        sliced_questions.splice(askedQuestionIndex, 1);
    })
    if (sliced_questions.length == 0) return;
    return sliced_questions[0];
}

function sendNextQuestionFromArray(toAskQuestions) {
    let toAskQ = toAskQuestions.filter((d) => {
        return !d.asked;
    });
    return toAskQ[0];
}

function makeAllQuestionsToDefaultState(questions) {
    for (let i = 0; i < questions.length; i++) {
        questions[i].asked = false;
    }
    return questions;
}

function handleResponses(received_text, sender_psid) {
    received_text = received_text.toLowerCase();
    var msgCategory = '';
    let response_message = '';
    var greetinngs = received_text.includes('hi') || received_text.includes('hey') || received_text.includes('hello');
    if (greetinngs) {
        makeAllQuestionsToDefaultState(users[sender_psid].questions);
        users[sender_psid].previousMessages = [];
        msgCategory = 'greetinngs';
        users[sender_psid].questions[0].asked = true;
        response_message = users[sender_psid].questions[0];
    } else {
        // let userNextResponse = sendNextQuestionFromArray(userQuestions);
        let userNextResponse = checkPreviousMessagesForTheFlow(users[sender_psid].previousMessages);
        if (userNextResponse) {
            userNextResponse.asked = true;
            response_message = userNextResponse;
        }
    }
    return response_message;
}

exports.handleMessage = (sender_psid, received_message) => {
    let response;

    // Checks if the message contains text
    if (received_message.text) {
        // Create the payload for a basic text message, which
        // will be added to the body of our request to the Send API
        let toSendMessage = handleResponses(received_message.text, sender_psid);
        if (toSendMessage && toSendMessage.q) {
            if (!toSendMessage.generic) {
                response = {
                    "text": toSendMessage.q
                }
                // users[sender_psid].previousMessages.push([{ message: received_message.text, id: received_message.mid }, toSendMessage.q]);
                console.log(' users[sender_psid].previousMessages.push([received_message, toSendMessage]); ::', JSON.stringify(users));
            } else {
                response = askGenericQuestion({ text: toSendMessage.q, subMessage: toSendMessage.subQ, payloadYes: toSendMessage.payloadYes, payloadNo: toSendMessage.payloadNo });
            }
            users[sender_psid].previousMessages.push([{ message: received_message.text, id: received_message.mid }, toSendMessage.q]);
        } else {
            response = askGenericQuestion({ text: "Do you want to start again?", subMessage: "Your previous messages will be removed." });
        }
    } else if (received_message.attachments) {
        // Get the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
    }

    // Send the response message
    callSendAPI(sender_psid, response);
}

function askGenericQuestion(message) {
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": message.text,
                    "subtitle": message.subMessage,
                    // "image_url": attachment_url,
                    "buttons": [
                        {
                            "type": "postback",
                            "title": "Yes!",
                            "payload": message.payloadYes || "yes",
                        },
                        {
                            "type": "postback",
                            "title": "No!",
                            "payload": message.payloadNo || "no",
                        }
                    ],
                }]
            }
        }
    }
    return response;
}

exports.createUserIfNotFound = (sender_psid) => {
    if (!users[sender_psid]) {
        users[sender_psid] = {};
        users[sender_psid].previousMessages = [];
        users[sender_psid].questions = questions.slice();
    }
}

function checkForPreviousMessage(previousQuestions, question) {
    let numberOfDaysInDoB = 0;
    let previousQuestionIndex = previousQuestions.length - 1;   // increment by one because user answers in the next attempt
    let usersReply = previousQuestions[previousQuestionIndex][0].message;
    let splittedReply = usersReply.split('-');
    splittedReply[0] = new Date().getFullYear().toString();
    let thisYearDate = splittedReply.join('-');
    if (new Date().getTime() > new Date(thisYearDate).getTime()) {
        console.log('YOUR BIRTH DATE HAS PASSED :(');
        splittedReply[0] = new Date().getFullYear() + 1;
        splittedReply[0] = '' + splittedReply[0];
        numberOfDaysInDoB = daysBetween(new Date().getTime(), new Date(splittedReply.join('-')).getTime());
    } else {
        console.log('YOUR BIRTH DATE HAS TO COME :)');
        numberOfDaysInDoB = daysBetween(new Date(thisYearDate).getTime(), new Date().getTime());
    }
    console.log(" numberOfDaysInDoB ::", numberOfDaysInDoB);
    return numberOfDaysInDoB;
}

function daysBetween(one, another) {  // <one,another> is the timestamp of start and end time
    return Math.round(Math.abs((+one) - (+another)) / 8.64e7);   //8.64e7 is the number of milliseconds in a day.
}

exports.handlePostback = (sender_psid, received_postback) => {
    console.log('ok')
    let response;
    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        users[sender_psid].previousMessages = [];
        makeAllQuestionsToDefaultState(users[sender_psid].questions);
        response = { "text": "Thanks! Your previous messages has been removed. Start by greeting again" }
    } else if (payload === 'no') {
        response = { "text": "Thanks!" }
    } else if (payload === 'calculate') {
        let numOfDaysInDoB = checkForPreviousMessage(users[sender_psid].previousMessages, questions[1]);
        response = { "text": `There are ${numOfDaysInDoB} number of days in your birth date` }
    } else if (payload === 'calculate-no') {
        response = { "text": `Goodbye 👋` }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": `${BASE_URL}/me/messages`,
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

exports.getUsers = () => {
    return users;
}