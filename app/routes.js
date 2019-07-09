var express = require('express');
var webhook = require('./controllers/webhook');

var app = express();

app.get('/webhook', webhook.validateWebhook);
app.post('/webhook', webhook.sendMessage);
app.get('/messages', webhook.showMessages);
app.get('/messages/:id', webhook.getMessageById);

module.exports = app;