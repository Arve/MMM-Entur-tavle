let NodeHelper = require('node_helper');
let request = require('request');

module.exports = NodeHelper.create({

    start: function(){
        console.log("Starting node helper for: " + this.name);
    },

    getFullId: function(id, type, authority){
        return `${authority}:${type}:${id}`;
    },

    prepareQuery: function(data){
            let start_time = '';
            let query_init = '';
            const full_id = this.getFullId(data.id, data.stopType, data.authorityId);
            if (data.startDate) {
                let start_time = `startTime: "${data.start_time}", `;
            };
    
            if (data.stopType === "StopPlace"){
                query_init = `stopPlace(id: "${full_id}")`;
            } else if (data.stopType === "Quay"){
                query_init = `quay (id: "${full_id}")`;
            }; 
             return `{
                ${query_init} {
                id
                name
                estimatedCalls(${start_time} timeRange: 72100, numberOfDepartures: ${this.config.numResults}) {
                  aimedDepartureTime
                  expectedDepartureTime
                  actualDepartureTime
                  realtime
                  realtimeState
                  forBoarding
                  destinationDisplay {
                    frontText
                  }
                  serviceJourney {
                    journeyPattern {
                      line {
                        id
                        name
                        transportMode
                        publicCode
                      }
                    }
                  }
                }
              }
            }`; 
    },

    socketNotificationReceived: function(message, payload){
        if (message === "GET_DEPARTURES"){
            let options = {
                url: payload.url,
                method: "POST",
                headers: {
                    "ETClientName": payload.ETClientName
                },
                json: this.prepareQuery(payload),
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
