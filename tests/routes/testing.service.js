
var messagePayload = {
    object: 'page',
    entry: [
        {
            messaging: [
                {
                    sender: {
                        id: 5
                    },
                    message: 'Hi!'
                }
            ]
        }
    ]
}
exports.createMessagePayload = (uid, message) => {
    messagePayload['entry'][0].messaging[0].sender.id = uid;
    messagePayload['entry'][0].messaging[0].message = message;
    return messagePayload;
}