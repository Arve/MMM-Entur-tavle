Module.register('MMM-Entur-tavle', {
    defaults: {
        ETApiUrl: "https://api.entur.org/journeyplanner/2.0/index/graphql",
        ETClientName: "MMM-Entur-tavle",
        stopId: "12345",
        stopType: "StopPlace", // StopPlace or Quay - case sensitive.
        numResults: 5,
        authorityId: "NSR",
        highlightRealtime: false,
        showHeader: true,
        updateSpeed: 1000,
        size: 'medium',
        refresh: 30
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
        }, this.config.refresh*1000)
    },

    getDepartures: function(){
        const payload = {
            url: this.config.ETApiUrl,
            ETClientName: this.config.ETClientName,
            id: this.config.stopId,
            stopType: this.config.stopType,
            authorityId: this.config.authorityId,
            numResults: this.config.numResults
        };
        this.sendSocketNotification("GET_DEPARTURES", payload)
    },

    getCell: function(cellText, className) {
        let cell = document.createElement('td');
        if (!!className) {
            cell.className = className;
        }
        cell.innerHTML = cellText;
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
                if (this.config.highlightRealtime && journey.realtime === true) {row.className += ' regular'}
                row.appendChild(this.getCell(journey.serviceJourney.journeyPattern.line.publicCode, 'align-left'));
                row.appendChild(this.getCell('&nbsp;'));
                row.appendChild(this.getCell(journey.destinationDisplay.frontText));
                row.appendChild(this.getCell('&nbsp;'));
                row.appendChild(this.getCell(this.getTimeString(moment().local().toISOString(), journey.expectedDepartureTime), 'align-right'));
                table.appendChild(row);
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
            this.updateDom(this.config.updateSpeed);
        }
    },

    getTimeString: function(queryTime, departureTime){
        let diffSeconds = moment(departureTime).diff(queryTime, 'seconds')
        let diffMinutes = moment(departureTime).diff(queryTime, 'minutes')
        if (diffSeconds < 0) {
            return "Gått";
        } else if (diffSeconds < 60){
            return "Nå";
        } else if (diffSeconds < 600){
            return diffMinutes+' min';
        } else {
            return moment(departureTime).local().format("HH:mm")
        }
    },
});
