Module.register('MMM-avgangstavle', {

    defaults: {
        ETapiUrl: "https://api.entur.org/journeyplanner/2.0/index/graphql"
        ETClientName: "MMM-avgangstavle-dev",
        stopId: "12345",
    },

    getScripts: function(){
        return [ "moment.js" ]
    }

    prepareQuery: function(iso_date, stop_id){
        // TODO: Allow for quays
        return `{
          stopPlace(id: "NSR:StopPlace:${stop_id}") {
            id
            name
            estimatedCalls(startTime: "${iso_date}", timeRange: 72100, numberOfDepartures: 10) {
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
