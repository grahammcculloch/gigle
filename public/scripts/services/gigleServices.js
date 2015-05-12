/* Angular resource to search for Songkick events
 * Ref: http://www.songkick.com/developer/event-search
 *
 * NOTE: We use JSONP as the Songkick API does not support CORS.
 */
app.factory('Event', function($resource) {
    return $resource("http://api.songkick.com/api/3.0/events.json?jsoncallback=angular.callbacks._0", {}, {
        jsonp_query: {
            method: 'JSONP'
        }
    })
});
