var app = angular.module('gigleApp', ['ngResource', 'ngRoute']);

app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
        when('/gigs', {
            title: 'Gigle | Gig Map',
            templateUrl: 'partials/map.html',
            controller: 'MapCtrl'
        }).
        when('/welcome', {
            title: 'Gigle | Welcome',
            templateUrl: 'partials/welcome.html',
            controller: 'WelcomeCtrl'
        }).
        otherwise({
            redirectTo: '/welcome'
        });
    }
]);

// Avoid another ng-bind by setting the document title in this way
app.run(['$rootScope', '$route', function($rootScope, $route) {
    $rootScope.$on('$routeChangeSuccess', function(newVal, oldVal) {
        if (oldVal !== newVal) {
            document.title = $route.current.title;
        }
    });
}]);
