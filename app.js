'use strict';
var express = require('express');
var body_parser = require('body-parser');

var routes = require('./app/routes');

var app = express();
app.use(body_parser.json());
// Imports dependencies and set up http server
// creates express http server

app.set('port', process.env.PORT || 1337);
// Sets server port and logs message on success

app.use('/', routes);

app.listen(app.get('port'), () => console.log('webhook is listening on port %d', app.get('port')));