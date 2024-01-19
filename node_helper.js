const Log = require("logger");
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

    start() {
        Log.log(`Starting node helper for: ${this.name}`);
    },

    getFullId(id, type, authority) {
        return `${authority}:${type}:${id}`;
    },

    prepareQuery(data) {
        let startTime = "";
        let queryInit = "";
        const fullId = this.getFullId(data.id, data.stopType, data.authorityId);
        if (data.startTime) {
            startTime = `startTime: "${data.startTime}", `;
        }
        if (data.stopType === "StopPlace") {
            queryInit = `stopPlace(id: "${fullId}")`;
        }
        else if (data.stopType === "Quay") {
            queryInit = `quay (id: "${fullId}")`;
        }

        let whitelist = data.whiteListedTransportModes;
        if (whitelist.length !== 0) {
            whitelist = `[${whitelist}]`; // example format: whiteListedModes: [tram,metro]
        }
        else {
            whitelist = null;
        }

        const query = `{
                ${queryInit} {
                id
                name
                estimatedCalls(${startTime}
                    timeRange: 72100
                    numberOfDepartures: ${data.numResults}
                    whiteListedModes: ${whitelist}
                    ) {
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

    async socketNotificationReceived(message, payload) {
        try {
            const body = this.prepareQuery(payload);
            if (message === "GET_DEPARTURES") {
                const options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ET-Client-Name": payload.ETClientName
                    },
                    body: JSON.stringify({ query: body })
                };

                const res = await fetch(payload.url, options);
                Log.debug(`return code: ${res.status}`);
                if (res.status === 200 || res.status === 304) {
                    const rb = await res.json();
                    const path = rb.data.stopPlace
                        ? rb.data.stopPlace
                        : rb.data.quay;
                    Log.debug(rb.data);
                    this.sendSocketNotification("DEPARTURE_LIST", path);
                }
            }
        }
        catch (error) {
            Log.error(error);
            // Handle errors as needed
        }
    }
});
