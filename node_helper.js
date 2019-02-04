let NodeHelper = require("node_helper");
let request = require("request");

module.exports = NodeHelper.create({

    start: function(){
        console.log("Starting node helper for: " + this.name);
    },

    getFullId: function(id, type, authority){
        return `${authority}:${type}:${id}`;
    },

    prepareQuery: function(data){
        let startTime = "";
        let queryInit = "";
        const fullId = this.getFullId(data.id, data.stopType, data.authorityId);
        if (data.startTime) {
            startTime = `startTime: "${data.startTime}"`;
        };
        if (data.stopType === "StopPlace"){
            queryInit = `stopPlace(id: "${fullId}")`;
        } else if (data.stopType === "Quay"){
            queryInit = `quay (id: "${fullId}")`;
        };
        query = `{
                ${queryInit} {
                id
                name
                estimatedCalls(${startTime} timeRange: 72100 numberOfDepartures: ${data.numResults}) {
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
        return query;
    },

    socketNotificationReceived: function(message, payload){
        if (message === "GET_DEPARTURES"){
            let options = {
                url: payload.url,
                method: "POST",
                headers: {
                    "ETClientName": payload.ETClientName
                },
                json:{ query: this.prepareQuery(payload) },
            };
            var self = this;
            request.post(options, function(error, response, message){
                if (!error && (response.statusCode === 200 || response.statusCode === 304)) {
                    let path = (!!response.body.data.stopPlace)?response.body.data.stopPlace:response.body.data.quay;
                    self.sendSocketNotification("DEPARTURE_LIST", path);
                }
            });

        }
    }

});
