/*
 * @license
 * ioncube-angular-socket-io v1.0.0
 * Forked from angular-socket-io v0.7.0
 *
 * Changes (c) ionCube Ltd. 
 * https://www.ioncube.com https:/ioncube24.com 
 * License: MIT
 *
 * Original copyright
 * (c) 2014 Brian Ford http://briantford.com
 * License: MIT
 */

angular.module('btford.socket-io', []).
provider('socketFactory', function () {

    'use strict';

    // when forwarding events, prefix the event name
    var defaultPrefix = 'socket:';

    // expose to provider
    this.$get = ['$rootScope', '$timeout',
        function ($rootScope, $timeout) {

            var asyncAngularify = function (socket, callback, doDigest) {
                return callback ? function () {
                    var args = arguments;
                    $timeout(function () {
                        callback.apply(socket, args);
                    }, 0, (doDigest !== false));
                } : angular.noop;
            };

            return function socketFactory(options) {
                options = options || {};
                var socket = options.ioSocket || io.connect();
                var prefix = options.prefix === undefined ? defaultPrefix : options.prefix;
                var defaultScope = options.scope || $rootScope;

                var addListener = function (eventName, callback, doDigest) {
                    socket.on(eventName, callback.__ng = asyncAngularify(socket, callback, doDigest));
                };

                var addOnceListener = function (eventName, callback, doDigest) {
                    socket.once(eventName, callback.__ng = asyncAngularify(socket, callback, doDigest));
                };

                var wrappedSocket = {
                    'on': addListener,

                    'addListener': addListener,

                    'once': addOnceListener,

                    emit: function (eventName, data, callback, doDigest) {
                        var lastIndex = arguments.length - 1;
                        var callback = arguments[lastIndex];

                        if (typeof callback == 'function') {
                            callback = asyncAngularify(socket, callback, doDigest);
                            arguments[lastIndex] = callback;
                        }

                        return socket.emit.apply(socket, arguments);
                    },

                    removeListener: function (ev, fn) {
                        if (fn && fn.__ng) {
                            arguments[1] = fn.__ng;
                        }
                        return socket.removeListener.apply(socket, arguments);
                    },

                    removeAllListeners: function () {
                        return socket.removeAllListeners.apply(socket, arguments);
                    },

                    disconnect: function (close) {
                        return socket.disconnect(close);
                    },

                    connect: function () {
                        return socket.connect();
                    },

                    // when socket.on('someEvent', fn (data) { ... }),
                    // call scope.$broadcast('someEvent', data)
                    forward: function (events, scope, doDigest) {
                        if (events instanceof Array === false) {
                            events = [events];
                        }
                        if (!scope) {
                            scope = defaultScope;
                        }
                        events.forEach(function (eventName) {
                            var prefixedEvent = prefix + eventName;
                            var forwardBroadcast = asyncAngularify(socket, function () {
                                Array.prototype.unshift.call(arguments, prefixedEvent);
                                scope.$broadcast.apply(scope, arguments);
                            }, doDigest);
                            scope.$on('$destroy', function () {
                                socket.removeListener(eventName, forwardBroadcast);
                            });
                            socket.on(eventName, forwardBroadcast);
                        });
                    }
                };

                return wrappedSocket;
            };
        }
    ];
});