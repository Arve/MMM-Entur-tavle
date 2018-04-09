let NodeHelper = require('node_helper');
let request = require('request');

module.exports = NodeHelper.create({

    start: function(){
        console.log("Starting node helper for: " + this.name);
    },


    socketNotificationReceived: function(message, payload){
        if (message === "GET_DEPARTURES"){
            let options = {
                url: payload.url,
                method: "POST",
                headers: {
                    "ETClientName": payload.ETClientName
                },
                json: payload.query
            };
            var self = this;
            request.post(options, function(error, response, message){
                if (!error && (response.statusCode == 200 || response.statusCode == 304)) {
                    let path = (!!response.body.data.stopPlace)?response.body.data.stopPlace:response.body.data.quay;
                    self.sendSocketNotification("DEPARTURE_LIST", path);
                }

            })

        }
    }

});