define(['app', 'realize-debugging'], function(app){
    app

    .directive('checkLogin', ['EVENTS', function(EVENTS){
            return {
                restrict: 'C',
                link: function(scope, elem, attrs){
                    console.log('checkLogin');
                    var login = elem.find("#loginForm");
                    var main = elem.find("#widget-container");
                    scope.$on('event:' + EVENTS.notAuthenticated, function() {
                        scope.login = true;
                        login.slideDown('slow', function() {
                            main.hide();
                        });
                        console.log('checkLogin: auth-needed');
                    });

                    scope.$on('event:' + EVENTS.loginSuccess, function() {
                        console.log("checkLogin: Login confirmed.");
                        main.show();
                        login.slideUp();
                        scope.login = false;
                    });
                }
            };
        }])

    .directive('leftMenu', [function () {
            return {
                templateUrl: 'partials/left-menu.tpl.html',
                replace: true,
                restrict: 'E',
                controller: 'LeftMenuCtrl',
                link: function(scope){
                    scope.updatePlugins();
                }
            };
        }])

    .directive('loginForm', [function(){
            return {
                templateUrl: 'partials/realize_login.tpl.html',
                replace: true,
                restrict: "E",
                controller: "LoginCtrl"
            };
        }])

    .directive('rightMenu', [function () {
            return {
                templateUrl: 'partials/right-menu.tpl.html',
                replace: true,
                restrict: 'E',
                controller: 'RightMenuCtrl'
            };
        }])

    .directive('topNav', [function () {
            return {
                templateUrl: 'partials/top-nav.tpl.html',
                replace: true,
                restrict: 'E',
                controller: 'TopNavCtrl'
            };
        }])


    // adds a pseudo phone body around the content when on a desktop, for pre-beta evaluation
    .directive('hapSize', ['$timeout','$window', 'debugging', function ($timeout, $window, debugging) {
            return {
                restrict: 'A',
                link: function (scope) { // scope, iElement, iAttrs


                    function size(){

                        var wHeight = $window.innerHeight;
                        var wWidth = $window.innerWidth;
                        var container = angular.element('.root-container');

                        function px(percent){
                            return Math.floor(wWidth * percent / 100) + 'px';
                        }

                        // resize the container
                        /* global detectMobileBrowser */
                        if(debugging.detectMobileBrowser() === false){
                            // could use a media query for some of this, but doing it here
                            // to keep all beta-testing resize code in one place.

                            if (wHeight > 800) {
                                // 1000 pics is a mobile screen, but it often requires
                                // scrolling on conventional browsers, so limit the size here.
                                wHeight = 800;
                            }
                            // maintain a 16:9 aspect ratio
                            var maxWidth = Math.floor(wHeight / 16 * 9);
                            var maxHeight = Math.floor(wWidth / 9 * 16);
                            if(wWidth > maxWidth){
                                wWidth = maxWidth;
                            } else if (wHeight > maxHeight){
                                wHeight = maxHeight;
                            }

                            // wrap iin a pseudo phone border for beta testers to see on their computers
                            // and resize to fit aspect ratio
                            container.css({
                                width:wWidth,
                                height:wHeight,
                                border:"30px solid #000",
                                borderBottom:"90px solid #000",
                                // and center it
                                position:'absolute',
                                margin:'auto',
                                top:0,
                                left:0,
                                bottom:0,
                                right:0
                            });

                        } else{
                            container.attr('style','width:100%;height:100%;');
                        }

                        // make the font size dynamic
                        container.css({
                            fontSize:px(4)
                        });
                    }
                    // wait for browser rendering to finish the last menu
                    // ugh. Angular lacks a callback for all rendering done.
                    // this is hacky.  Need a better way within the scope lifecycle so we don't need setTimeout.
                    // Potential solution!!
                    // $viewContentLoaded from ui router at https://github.com/angular-ui/ui-router/wiki/Quick-Reference#events-1
                    $timeout(size,0);

                    // resize when window resizes
                    angular.element($window).bind('resize', function () {
                        scope.$apply(function(){
                            size();
                        });
                    });
                }
            };
        }]);

});
