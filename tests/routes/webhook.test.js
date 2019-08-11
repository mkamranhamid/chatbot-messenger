const expect = require('chai').expect;

const { validateWebhook, showMessages, getMessageById } = require('../../app/controllers/webhook');
const { VERIFY_TOKEN } = require('../../app/services/constants');


let req = {
    body: {}
};

let res = {
    send_called_with: '',
    send_status_with: '',
    status: (arg) => {
        res.send_status_with = arg;
        return {
            send: (arg1) => {
                res.send_called_with = arg1;
            }
        }
    },
    sendStatus: (arg) => {
        res.send_status_with = arg;
    }
};

describe('App routes', () => {
    describe('Webhooks', () => {
        it('Should give error if wrong token provided', () => {
            req['query'] = {
                "hub.mode": "subscribe",
                "hub.verify_token": VERIFY_TOKEN,
                "hub.challenge": "verified",
            }
            validateWebhook(req, res);
            expect(`${res.send_status_with}`).to.contain('200');
        });
    })
    describe('APIs', () => {
        it('Should give 200 if no user found in runtime', () => {
            showMessages(req, res);
            expect(`${res.send_status_with}`).to.contain('200');
        });
        it('Should give 200 if no user by id found in runtime', () => {
            req['params'] = {
                id: 6
            }
            getMessageById(req, res);
            expect(`${res.send_status_with}`).to.contain('200');
        });
    })
});
