Module.register("MMM-Entur-tavle", {
    defaults: {
        ETApiUrl: "https://api.entur.io/journey-planner/v2/graphql",
        ETClientName: "MMM-Entur-tavle",
        stopId: "12345",
        stopType: "StopPlace", // StopPlace or Quay - case sensitive.
        numResults: 5,
        authorityId: "NSR",
        highlightRealtime: false,
        showHeader: true,
        updateSpeed: 1000,
        size: "medium",
        refresh: 30,
        showTransportMode: false,
        timeOffset: [ 0, "seconds"],
        exclusions: [],
        delay: [0, 'seconds'],
    },

    getStyles: function () {
        return ["font-awesome.css"];
    },

    getScripts: function(){
        return [ "moment.js" ];
    },
    getTranslations: function() {
        return {
            nb: "translations/nb.json",
            nn: "translations/nn.json",
            en: "translations/en.json"
        };
    },

    start: function(){
        var self = this;
        this.fullId = `NSR:${this.config.stopType}:${this.config.stopId}`;
        this.journeys = [];
        this.getDepartures();
        setInterval( function(){
            self.getDepartures();
        }, this.config.refresh*1000);
    },

    getDepartures: function(){
        startTime = moment().add(moment.duration(this.config.delay[0], this.config.delay[1]));
        const payload = {
            url: this.config.ETApiUrl,
            ETClientName: this.config.ETClientName,
            id: this.config.stopId,
            stopType: this.config.stopType,
            authorityId: this.config.authorityId,
            numResults: this.config.numResults,
            startTime: startTime.toISOString(),
        };
        this.sendSocketNotification("GET_DEPARTURES", payload);
    },

    getCell: function(cellText, className) {
        let cell = document.createElement("td");
        if (!!className) {
            cell.className = className;
        }
        cell.innerHTML = cellText;
        return cell;
    },

    getDom: function(){
        let wrapper = document.createElement("div");
        wrapper.className = `align-left light bright ${this.config.size}`;
        if (this.journeys.length > 0){
            let table = document.createElement("table");
            if (this.config.showHeader){
                let hrow = document.createElement("div");
                hrow.className = "light small align-right";
                hrow.innerHTML = this.quayName;
                wrapper.appendChild(hrow);
            }
            for (const journey of this.journeys){
                let exclusions = this.config.exclusions.map( (excl) => { return excl.toLowerCase(); } );
                let publicCode = journey.serviceJourney.journeyPattern.line.publicCode;
                if (exclusions.includes(publicCode.toLowerCase())){
                    continue;
                }
                let row = document.createElement("tr");
                if (this.config.highlightRealtime && journey.realtime === true) {
                    row.className += " regular";
                };
                if (this.config.showTransportMode) {
                    var icon = document.createElement("i");
                    icon.className = this.getTransportIcon(journey.serviceJourney.journeyPattern.line.transportMode);
                    icon.innerHTML = "&nbsp;";
                    row.appendChild(icon);
                    row.appendChild(this.getCell("&nbsp;"));
                };
                row.appendChild(this.getCell(publicCode, "align-left"));
                row.appendChild(this.getCell("&nbsp;"));
                row.appendChild(this.getCell(journey.destinationDisplay.frontText));
                row.appendChild(this.getCell("&nbsp;"));
                row.appendChild(this.getCell(this.getDepartureTime(moment().local().toISOString(), journey.expectedDepartureTime), "align-right"));
                table.appendChild(row);
            }
            wrapper.appendChild(table);
        } else {
            wrapper.innerHTML = this.translate("LOADING");
        }
        return wrapper;
    },

    socketNotificationReceived: function(message, payload){
        if ((message === "DEPARTURE_LIST") && (payload.id === this.fullId)){
            this.quayName = payload.name;
            this.journeys = payload.estimatedCalls;
            this.updateDom(this.config.updateSpeed);
        }
    },

    getTransportIcon: function (type){
        switch (type) {
            case "bus":
                return "fa fa-bus";
            case "bike":
                return "fa fa-bicycle";
            case "water":
                return "fa fa-ship";
            case "metro":
                return "fa fa-subway";
            case "rail":
                return "fas fa-train";
            case "tram":
                return "fa fa-subway";
            default:
                return null;
        }
    },

    getDepartureTime: function(queryTime, departureTime){
        let diffSeconds = moment(departureTime).diff(queryTime, "seconds");
        let diffMinutes = moment(departureTime).diff(queryTime, "minutes");
        if (diffSeconds < 0) {
            return this.translate("departed");
        } else if (diffSeconds < 60){
            return this.translate("now");
        } else if (diffSeconds < 600){
            let min = this.translate("min");
            return `${diffMinutes} ${min}`;
        } else {
            return moment(departureTime).local().format("HH:mm");
        }
    },
});