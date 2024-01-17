/* eslint-disable prettier/prettier */
const { response } = require("express");

let fetchPromise; // Use a promise to ensure proper initialization

async function initializeFetch() {
  try {
    const nodeFetch = await import("node-fetch");
    fetchPromise = Promise.resolve(nodeFetch.default);
    console.log("fetch is initialized");
  } catch (error) {
    console.error("Error importing 'node-fetch':", error);
  }
}

// Initialize fetch when the module is loaded
initializeFetch();

const NodeHelper = require("node_helper");

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
            startTime = `startTime: "${data.startTime}", `;
        }
        if (data.stopType === "StopPlace"){
            queryInit = `stopPlace(id: "${fullId}")`;
        } else if (data.stopType === "Quay"){
            queryInit = `quay (id: "${fullId}")`;
        };

        let whitelist = data.whiteListedTransportModes;
        if (whitelist.length !== 0){
            whitelist = `[${whitelist}]`; // example format: whiteListedModes: [tram,metro]
        } else {
            whitelist = null;
        }

        let $query =  `{
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
        return $query;
    },

    socketNotificationReceived: async function(message, payload){
        try {
            // Wait for fetch to be initialized
            const fetch = await fetchPromise;

            const body = this.prepareQuery(payload);
            if (message === "GET_DEPARTURES"){
                const options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ET-Client-Name": payload.ETClientName
                    },
                    body: JSON.stringify({ query: body }),
                };
                console.log(fetch); // Check if 'fetch' is available
                const res = await fetch(payload.url, options);
                console.log("return code: " + res.status);
                if (res.status === 200 || res.status === 304) {
                    const rb = await res.json();
                    const path = !!rb.data.stopPlace ? rb.data.stopPlace : rb.data.quay;
                    console.log(rb.data);
                    this.sendSocketNotification("DEPARTURE_LIST", path);
                }
            }
        } catch (e) {
            console.log(e);
            // Handle errors as needed
        }
    }
});
