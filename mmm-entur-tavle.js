Module.register('MMM-Entur-tavle', {

    defaults: {
        ETapiUrl: "https://api.entur.org/journeyplanner/2.0/index/graphql",
        ETClientName: "MMM-Entur-tavle-dev",
        stopId: "12345",
        stopType: "stopPlace", // stopPlace or quay
        numResults: 5
    },

    getScripts: function(){
        return [ "moment.js" ];
    },

    prepareQuery: function(iso_date){

        if (!iso_date) {
            let start_time = `startTime: "${iso_date}", `;
        } else {
            let start_time = '';
        }

        if (config.stopType === "stopPlace"){
            let query_init = `stopPlace(id: "NSR:StopPlace:${stop_id}") {`;
        } else if (config.stopType === "quay"){
            let query_init = `stopPlace(id: "NSR:StopPlace:${stop_id}") {`;
        } 

        return `{
            ${query_init}
            id
            name
            estimatedCalls(${start_time} timeRange: 72100, numberOfDepartures: ${config.numResults}) {
              aimedDepartureTime
              expectedDepartureTime
              actualDepartureTime
              realtime
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

    getTimeString: function(query_time, departure_time){
        let diff_seconds = moment(departure_time).diff(query_time, 'seconds')
        let diff_minutes = moment(departure_time).diff(query_time, 'minutes')
        if (diff_seconds < 0) {
            return "Gått";
        } else if (diff_seconds < 60){
            return "Nå";
        } else if (diff_seconds < 600){
            return diff_minutes+' min';
        } else {
            return moment(departure_time).local().format("HH:mm")
        }
    },




});
