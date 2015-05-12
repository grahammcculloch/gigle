/** Utility function to navigate to a new view in the SPA.
 *
 *  @param {$location} reference to the $location service
 *  @param {destination} the relative URL path to navigate to
 *  @param {queryParams} Key-value pairs of query parameters
 */
function navigate($location, destination, queryParams){
    $location.url($location.path());
    for(var queryParam in queryParams){
        $location.search(queryParam, queryParams[queryParam]);
    }
    $location.path(destination);
}


/** The Welcome controller manages the 'landing' view - what the user first
 *  sees.
 *
 *  Note that the user can be redirected to this page if a problem occurs
 *  (e.g. geolocation fails, etc.).
 */
app.controller('WelcomeCtrl', function($scope, $sce, $location) {

    var GEO_DISABLED_MSG = "Geolocation is disabled for this app.<br>Either re-enable it or search for a location.";
    var GEO_NOT_SUPPORTED_MSG = "Your browser does not support geolocation.<br>Search for a location instead.";

    init();

    function init() {
        var urlParams = $location.search();

        // If geolocation isn't available, only allow the search option
        if (typeof urlParams.geolocation !== 'undefined') {
            $scope.search_only = true;
            var err_html = urlParams.geolocation == "disabled" ? GEO_DISABLED_MSG : GEO_NOT_SUPPORTED_MSG
            $scope.geolocation_err_msg = $sce.trustAsHtml(err_html);
            $('#search-input').focus();
        }
        else {
            $scope.search_only = false;
        }

        // Setup Google Places autocomplete for the search box
        $scope.search_location = "";
        var search = document.getElementById('search-input');
        var autocomplete = new google.maps.places.Autocomplete(search);
        google.maps.event.addListener(autocomplete, 'place_changed', function() {
            $scope.search_location = autocomplete.getPlace().formatted_address;
        });
    }

    $scope.search = function() {
        navigate($location, '/gigs', {'location': $scope.search_location});
    }

});


/** The Map Controller handles the interaction with Google Maps and Songkick.com
 *
 */
app.controller('MapCtrl', function($scope, $location, Event) {

    var GIG_LIMIT = 50;
    var SONGKICK_API_KEY = "rxIy4wLIpypraOUm";  // TODO: Should not be visible in client-side code
    var geocoder = new google.maps.Geocoder();
    var map;
    var mapOptions = { zoom: 12 };
    var mapCenter;
    var venues = {};
    var venueInfoBox = new InfoBox();
    var venueInfoTemplate = Handlebars.compile($("#entry-template").html());

    init();

    function init() {
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        var urlParams = $location.search();

        if (typeof urlParams.location !== 'undefined') {
            getEventsFromSearch(urlParams.location);
        }
        else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                getEventsFromLocation,
                function() {
                    // Geolocation was blocked, so we return to the welcome view
                    $scope.$apply(function() {
                        navigate($location, '/welcome', {'geolocation': 'disabled'});
                });
            });
        } else {
            // Geolocation is not supported so we return to the welcome view
            $scope.$apply(function() {
                navigate($location, '/welcome', {'geolocation': 'not_supported'});
            });
        }
    }

    /** Marks the user's location and retrieves events near
     *  to this location.
     *
     * @param {position} A Position (ref: http://www.w3.org/TR/geolocation-API/#position)
     */
    function getEventsFromLocation(position){
        mapCenter = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude);

        var w3cMarker = new google.maps.Marker({
            position: mapCenter,
            map: map,
            title: 'You are here',
            icon: 'images/location.png'
        });

        map.setCenter(mapCenter);
        getEvents(mapCenter);
    }

    /** Retrieves geographical location of given address and
     *  retrieves events near to this location.
     *
     *  @param {address} String address to lookup (e.g. 'London, UK')
     */
    function getEventsFromSearch(address) {
        geocoder.geocode({
            address: address
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                mapCenter = results[0].geometry.location
                map.setCenter(mapCenter);
                getEvents(mapCenter);
            } else {
                alert('Address could not be geocoded: ' + status);
            }
        });
    }

    /** Uses a $resource linked to Songkick's API to search for upcoming events
     *  based on the given location.
     *
     *  @param {location} An instance of google.maps.LatLng. Used as a query parameter
     *                    in the API event search.
     */
    function getEvents(location) {
        // Format the location, e.g. "(50.1, -1.2)" -> "geo:50.1,-1.2"
        var geoLocation = "geo:" + location.toString().substring(1, location.toString().length - 1).replace(" ", "")

        var events = Event.jsonp_query({
                location: geoLocation,
                apikey: SONGKICK_API_KEY
            },
            function(data) {
                if (data.resultsPage.results.event.length > 0) {
                    dropMarkers(data.resultsPage.results.event);
                } else {
                    console.log("No events");
                }
            },
            function(error) {
                alert("Failed to get events: " + error);
                console.log(error);
            }
        );
    }


    /** Displays a marker for each nearby venue with at least one gig.
     *  Each marker has an associated InfoBox that will display all the
     *  upcoming gigs for that venue.
     *
     *  @param {events} Array of Songkick event objects
     */
    function dropMarkers(events) {
        clearMarkers();
        var limit = Math.min(GIG_LIMIT, events.length);

        // First group events by venue
        for (var i = 0; i < limit; i++) {
            var ev = events[i];
            // Ignore events that are cancelled or have no venue associated with them
            if (ev.status == 'cancelled' || ev.venue.id == null) {
                continue;
            }
            // Use string identifiers to enforce 'associative array' behaviour
            // and avoid creating a sparsely populated array
            var venue_id = ev.venue.id.toString();
            if (!(venue_id in venues)) {
                venues[venue_id] = {'events': [], 'venue': ev.venue};
            }
            venues[venue_id].events.push(ev);
        }

        // Now add a marker for each venue
        for (var venue_id in venues) {
            addMarker(venues[venue_id]);
        }
    }

    /** Sets up the marker and InfoBox for a venue.
     *
     *  @param {venueDetails} Contains the venue object and a list of event objects
     */
    function addMarker(venueDetails) {
        // Keep a reference to the marker so we can access it later (e.g. to remove it)
        venueDetails.marker = new google.maps.Marker({
            position: new google.maps.LatLng(venueDetails.venue.lat, venueDetails.venue.lng),
            map: map,
            animation: google.maps.Animation.DROP,
            title: venueDetails.venue.displayName,
            icon: 'images/sk_map_marker_32.png'
        });
        google.maps.event.addListener(venueDetails.marker, 'click', function() {

            var infoBoxOptions = {
                alignBottom: true,
                content: venueInfoTemplate(venueDetails),
                disableAutoPan: false,
                maxWidth: 0,
                pixelOffset: new google.maps.Size(-150, -32),
                zIndex: null,
                closeBoxMargin: "6px -10px 2px 2px",
                closeBoxURL: "images/close.png",
                infoBoxClearance: new google.maps.Size(1, 1),
                isHidden: false,
                pane: "floatPane",
                enableEventPropagation: false
            };

            venueInfoBox.setOptions(infoBoxOptions);

            // Dynamically activate the custom scrollpane/scrollbar in the InfoBox
            google.maps.event.addListener(venueInfoBox, 'domready', function() {
                $('.events').jScrollPane();
            });

            venueInfoBox.open(map, venueDetails.marker);
        });
    }

    function clearMarkers() {
        for (var venue_id in venues) {
            venues[venue_id].marker.setMap(null);
        }
        venues = {};
    }
});
