
var constants = require('../services/constants');
var webhookHelper = require('../services/webhook-helpers');

let { VERIFY_TOKEN } = constants;
exports.validateWebhook = (req, res) => {

    /** UPDATE YOUR VERIFY TOKEN **/
    // const VERIFY_TOKEN = VERIFY_TOKEN;

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Respond with 200 OK and challenge token from the request
            res.status(200).send(challenge);
            return
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
            return;
        }
    }
    res.sendStatus(403);
    return;
}

exports.sendMessage = (req, res) => {

    // Parse the request body from the POST
    let body = req.body;
    console.log('INSIDE POST WEBHOOK::');
    console.log('body.entry ::', JSON.stringify(body.entry));

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        body.entry.forEach(function (entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);
            /* if (webhook_event.message.is_echo) {
                res.status(200).send('EVENT_RECEIVED');
                return;
            } */

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender ID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            webhookHelper.createUserIfNotFound(sender_psid);
            if (webhook_event.message) {
                webhookHelper.handleMessage(sender_psid, webhook_event.message);
                res.status(200).send('EVENT_RECEIVED');
            } else if (webhook_event.postback) {
                webhookHelper.handlePostback(sender_psid, webhook_event.postback);
                res.status(200).send('EVENT_RECEIVED');
            }

        });
        // Return a '200 OK' response to all events
        // res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
        return;
    }

}

exports.showMessages = (req, res) => {
    let messages = [];  //{uid,user_message,bot_message}
    let users = webhookHelper.getUsers();
    for (let key in users) {
        let uid = key;
        let previousMessages = users[key].previousMessages.map((d) => {
            return { uid: uid, user_message: d[0].message, bot_message: d[1], mid: d[0].id };
        })
        messages = messages.concat(previousMessages);
    }
    let thead = '<thead><tr><th>UID</th><th>User Message</th><th>Bot Message</th><th>Message Id</th></tr></thead>'
    let tr = messages.map((d) => {
        return `<tr><td>${d.uid}</td><td>${d.user_message}</td><td>${d.bot_message}</td><td>${d.mid}</td></tr>`
    });

    tr.splice(0, 0, thead);
    let table = `<table>${tr}</table>`
    res.status(200).send(table);
}

exports.getMessageById = (req, res) => {
    let users = webhookHelper.getUsers();
    let messageId = req.params.id;
    let requiredMessage;
    for (let key in users) {
        let messageFound = users[key].previousMessages.find((d) => {
            return d[0].id == messageId;
        })
        if (messageFound) {
            requiredMessage = { uid: key, id: messageFound[0].id, bot_message: messageFound[1], user_message: messageFound[0].message };
            break;
        }
    }
    res.status(200).send(requiredMessage || '<h4>no message found </h4>');
}