# MMM-EnTur-tavle


<img src="/images/screenshot.png" align="right"> This is a departure board made for [MagicMirror²](https://magicmirror.builders/) using the [Entur API](https://www.entur.org/dev/api/).  The board can show the next departures for all public transport in Norway including any mode of transportation.

## Installation

Enter your MagicMirror² module folder, e.g.:

    cd ~/MagicMirror/modules

Clone the repository

    git clone https://github.com/Arve/MMM-EnTur-tavle.git

Add the departure board to your configuration file, for instance:

    {
        module: "MMM-Entur-tavle",
        position: "top_right",
        config: {
            stopId: '58366',
            stopType: 'StopPlace'
            numResults: 5,
            showName: true,
            highlightRealtime: true
        }
    },

## Configuration

Currently available configuration options are as follows:

| Option            | Description                                                                                                                                                                                                                                                                                                                                                              | Default value |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| stopId            | A valid ID for a stop or quay (platform) from EnTur's director of stopPlaces.  You can either query for this through their GraphQL IDE, or extract the stopId from the query string generated when searching for a departure-board on [https://en-tur.no](https://en-tur.no).                                                                                            | "12345"       |
| stopType          | Chooses whether the place you are querying in stopId is a StopPlace or a quay.,A quay can for instance be a specific platform on a stopPlace - such as buses departing in a specific direction. Valid values are "StopPlace" and "Quay" (case sensitive). See separate documentation on stopType below. | "StopPlace"   |
| numResults        | Integer value holding the (maximum) number of results to be returned from the query.  Defaults to 5 results per stop                                                                                                                                                                                                                                                     | 5             |
| showHeader        | Boolean.  Whether to show the name of the stop or quay above the list of departures from the stop.                                                                                                                                                                                                                                                                       | true          |
| highlightRealtime | Boolean.  If set to `true`, departures that are updated with realtime info will be slightly bolded.                                                                                                                                                                                                                                                                      | false         |

## Use of stopType

In the EnTur/Journeyplanner API, a `stopPlace` can be an area where there are multiple platforms and modes of transporation within a limited geographical area (or it could simply be different platforms on the same stop).  In the case where you want to query a specific quay/platform instead of an entire stopPlace, set the value of `stopType` to `Quay`.

To get the specific quay, you will probably want to extract it from the GraphQL IDE.  You can use [this query](https://api.entur.org/doc/shamash-journeyplanner/?query=%7B%0A%20%20stopPlace(id%3A%20%22NSR%3AStopPlace%3A58366%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20estimatedCalls(timeRange%3A%2072100%2C%20numberOfDepartures%3A%2010)%20%7B%0A%20%20%20%20%20%20quay%20%7B%0A%20%20%20%20%20%20%20%20id%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20destinationDisplay%20%7B%0A%20%20%20%20%20%20%20%20frontText%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20serviceJourney%20%7B%0A%20%20%20%20%20%20%20%20journeyPattern%20%7B%0A%20%20%20%20%20%20%20%20%20%20line%20%7B%20%20%0A%20%20%20%20%20%20%20%20%20%20%20%20publicCode%0A%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D).

Replace the numeric part of the stopPlace ID ( `NSR:StopPlace:56338` ) with your own stopPlace's numeric id and run the query.  In the right-hand window, you will have a number of departures from that stopPlace, and each of the results will have sections similar to the following:

    "quay": {
        "id": "NSR:Quay:7184"
    },
    "destinationDisplay": {
        "frontText": "Vestli via Majorstuen"
    },    

… look for the quay number that corresponds to the frontText of the quay/platform you wish to display travels from.

## Multiple instances

This plugin fully supports multiple instances on the same MagicMirror² instance.  If you wish to display different platforms separately, use the stopType configuration option with separate quays as suggested above.

## Dislaimer

This module fetches data licensed under the [Norwegian License for open Government Data (NLOD)](https://data.norge.no/nlod/en) delivered by [Entur](https://www.entur.org/), but the application/module itself is not developed, maintained or endorsed by Entur.  

## Planned features

* Localization
* Inclusion of transport mode (Bus, plane, train, etc.) in display
* If other travel authorities offer access to the same GraphQL-based API: Add support for these as well. If you know of any such, please file an issue.