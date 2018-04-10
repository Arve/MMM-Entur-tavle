Module.register('MMM-Entur-tavle', {
    defaults: {
        ETApiUrl: "https://api.entur.org/journeyplanner/2.0/index/graphql",
        ETClientName: "MMM-Entur-tavle",
        stopId: "12345",
        stopType: "StopPlace", // StopPlace or Quay - case sensitive. 
        numResults: 5,
        highlightRealtime: false,
        showHeader: true,
        updateSpeed: 1000,
        size: 'medium'
    },
    
    getScripts: function(){
        return [ "moment.js" ];
    },

    start: function(){
        var self = this;
        this.full_id = `NSR:${this.config.stopType}:${this.config.stopId}`;
        this.journeys = [];
        this.getDepartures();
        setInterval( function(){
            self.getDepartures();
        }, 30000)
    },

    getDepartures: function(){
        const payload = {
            url: this.config.ETApiUrl,
            ETClientName: this.config.ETClientName,
            query: {
                query: this.prepareQueryString()
            }
        };
        this.sendSocketNotification("GET_DEPARTURES", payload)
    },

    getCell: function(cell_text, class_name) {
        let cell = document.createElement('td');
        if (!!class_name) {
            cell.className = class_name;
        }
        cell.innerHTML = cell_text;
        return cell;
    },

    getDom: function(){
        let wrapper = document.createElement('div');
        wrapper.className = "align-left light bright "+this.config.size;
        if (this.journeys.length > 0){
            let table = document.createElement('table')
            if (this.config.showHeader){
                let hrow = document.createElement('div');
                hrow.className = 'light small align-right'
                hrow.innerHTML = this.quayName;
                wrapper.appendChild(hrow)
            }
            for (const journey of this.journeys){
                let row = document.createElement('tr');
                if (this.config.highlightRealtime && journey.realtime === true) row.className += ' regular'
                row.appendChild(this.getCell(journey.serviceJourney.journeyPattern.line.publicCode, 'align-left'));
                row.appendChild(this.getCell('&nbsp;'));
                row.appendChild(this.getCell(journey.destinationDisplay.frontText)); 
                row.appendChild(this.getCell('&nbsp;'));
                row.appendChild(this.getCell(this.getTimeString(moment().local().toISOString(), journey.expectedDepartureTime), 'align-right')); 
                table.appendChild(row)
            }
            wrapper.appendChild(table)
        } else {
            wrapper.innerHTML = this.translate("LOADING");
        }
        return wrapper;
    },

    socketNotificationReceived: function(message, payload){
        if ((message === "DEPARTURE_LIST") && (payload.id === this.full_id)){
            this.quayName = payload.name;
            this.journeys = payload.estimatedCalls;
            this.updateDom(this.config.animationSpeed);
        }
    },

    prepareQueryString: function(iso_date){
        let start_time = '';
        let query_init = '';
        if (iso_date) {
            let start_time = `startTime: "${iso_date}", `;
        };

        if (this.config.stopType === "StopPlace"){
            query_init = `stopPlace(id: "${this.full_id}")`;
        } else if (this.config.stopType === "quay"){
            query_init = `quay(id: "${this.full_id}")`;
        } 
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
