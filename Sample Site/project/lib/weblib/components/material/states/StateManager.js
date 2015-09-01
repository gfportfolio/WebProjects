BASE.require([
    "jQuery",
    "BASE.web.Route",
    "components.material.segues.InertSegue",
    "jQuery.fn.region",
    "BASE.web.animation.ElementAnimation"
], function () {
    BASE.namespace("components.material.states");
    var Future = BASE.async.Future;
    var InertSegue = components.material.segues.InertSegue;
    var emptyFuture = Future.fromResult(undefined);
    var defaultAppearSegue = new InertSegue();
    var defaultDisappearSegue = new InertSegue();
    var ElementAnimation = BASE.web.animation.ElementAnimation;

    var emptyFn = function () {
        return undefined;
    };

    components.material.states.StateManager = function (elem, tags) {
        var self = this;

        var $elem = $(elem);

        var initialized = false;
        var activeStates = [];
        var states = {};
        var transitions = Future.fromResult();

        var resizeStateManagerAsync = function ($inboundElement, $outboundElement, duration) {
            if ($outboundElement) {
                var outboundHeight = $outboundElement.region().height;
                $outboundElement.removeClass('top-active-state');
                $elem.css('height', outboundHeight + 'px');
            }

            duration = duration || 1;

            var regionElem = $elem.region();
            var regionInboundElement = $inboundElement.region();

            var elementAnimation = new ElementAnimation({
                target: elem,
                easing: 'easeOutExpo',
                properties: {
                    height: {
                        from: regionElem.height + 'px',
                        to: regionInboundElement.height + 'px'
                    }
                },
                duration: duration
            });

            return elementAnimation.playToEndAsync().chain(function () {
                $inboundElement.addClass('top-active-state');
                $elem.css('height', 'auto');
            });
        }

        var recoverFuture = function (future) {
            return future.catchCanceled(emptyFn).catch(emptyFn);
        };

        var getStateName = function (state) {
            if (state == null) {
                return null;
            }

            return state.name;
        };

        var invokeMethodIfExist = function (controller, methodName, args) {
            var returnValue = emptyFuture;

            if (!Array.isArray(args)) {
                args = [];
            }

            if (controller) {
                var method = controller[methodName];
                if (typeof method === "function") {
                    returnValue = method.apply(controller, args);

                    if (!(returnValue instanceof Future)) {
                        returnValue = Future.fromResult(returnValue);
                    }

                }
            }

            return recoverFuture(returnValue);
        };

        var setLayerPrecedence = function () {
            var activeStateHash = activeStates.reduce(function (activeStateHash, state, index) {
                activeStateHash[state.name] = index + 2;
                return activeStateHash;
            }, {});

            Object.keys(states).forEach(function (name) {
                var $element = $(states[name]);

                if (typeof activeStateHash[name] === "number") {
                    $element.css("z-index", activeStateHash[name]);
                } else {
                    $element.removeClass("currently-active-state");
                    $element.css("z-index", 1);
                }
            });
        };

        var hasSegue = function (options) {
            return typeof options !== "undefined" && options !== null &&
                typeof options.segue !== "undefined" && options.segue !== null &&
                typeof options.segue.executeAsync === "function";
        };

        var pushAsync = function (element, options) {
            options = options || {};

            if (typeof element === "undefined") {
                throw new Error("The push to State does not exist.");
            }

            return new Future(function (setValue) {
                transitions = recoverFuture(transitions).chain(function () {
                    var name = element.getAttribute("name");
                    var segue = defaultAppearSegue;
                    var $element = $(element);
                    var prepareFutureArray = [];
                    var topState = self.getActiveState();
                    var topStateElement = null;
                    var pushToElementController = $element.controller();

                    var stateObject = {
                        element: element,
                        name: name,
                        options: options
                    };

                    if (hasSegue(options)) {
                        segue = options.segue;
                    }

                    $element.addClass("currently-active-state");

                    if (topState && topState.element === element) {
                        self.updateState(options);
                        setValue(name);
                        return Future.fromResult();
                    }

                    $elem.triggerHandler({
                        type: "stateChange",
                        newStateName: name,
                        oldStateName: getStateName(topState)
                    });

                    if (topState) {
                        topStateElement = topState.element;
                        var $topElement = $(topStateElement);
                        var topStateController = $topElement.controller();
                        prepareFutureArray.push(invokeMethodIfExist(topStateController, "prepareToDeactivateAsync"));
                    }

                    prepareFutureArray.push(invokeMethodIfExist(pushToElementController, "prepareToActivateAsync", [stateObject.options]).chain(function () {
                        var duration = 1;

                        if (typeof segue.getDuration !== undefined) {
                            duration = segue.getDuration();
                        }

                        return resizeStateManagerAsync($element, $topElement, duration);
                    }));

                    prepareFutureArray.push(recoverFuture(segue.executeAsync(topStateElement, $element[0])));

                    return Future.all(prepareFutureArray).chain(function () {

                        if (topStateController) {
                            invokeMethodIfExist(topStateController, "deactivated").try();
                        }

                        activeStates.push(stateObject);
                        $element.addClass("currently-active-state");
                        setLayerPrecedence();

                        invokeMethodIfExist(pushToElementController, "activated", [stateObject.options]).try();

                        setValue(stateObject.name);
                    });
                }).try();

            });
        };


        var popAsync = function (options) {
            return new Future(function (setValue) {
                transitions = recoverFuture(transitions).chain(function () {
                    if (activeStates.length > 1) {

                        if (activeStates.length > 0) {
                            $elem.triggerHandler({
                                type: "stateChange",
                                newStateName: getStateName(activeStates[activeStates.length - 2]),
                                oldStateName: getStateName(activeStates[activeStates.length - 1])
                            });
                        }

                        var segue = defaultDisappearSegue;

                        if (hasSegue(options)) {
                            segue = options.segue;
                        }

                        var topState = activeStates.pop();
                        var $topElement = $(topState.element);
                        var topElementController = $topElement.controller();

                        var newTopState = self.getActiveState();
                        var $newTopElement = $(newTopState.element);
                        var newTopElementController = $newTopElement.controller();

                        var prepareFutureArray = [];
                        prepareFutureArray.push(invokeMethodIfExist(topElementController, "prepareToDeactivateAsync"));
                        prepareFutureArray.push(invokeMethodIfExist(newTopElementController, "prepareToActivateAsync").chain(function () {
                            var duration = 1;

                            if (typeof segue.getDuration !== undefined) {
                                duration = segue.getDuration();
                            }

                            return resizeStateManagerAsync($newTopElement, $topElement, duration);
                        }));

                        prepareFutureArray.push(recoverFuture(segue.executeAsync($topElement[0], $newTopElement[0])));

                        return Future.all(prepareFutureArray).chain(function () {
                            var newStateName = $newTopElement.attr("name");

                            invokeMethodIfExist(topElementController, "deactivated").try();

                            if (typeof options === "object" && options !== null) {
                                newTopState.options = options;
                            }

                            setLayerPrecedence();

                            if (newTopState) {
                                invokeMethodIfExist(newTopElementController, "activated", [newTopState.options]).try();
                            }

                            setValue(newTopState.name);
                        });
                    } else {
                        setValue(self.getActiveState().name);
                    }
                }).try();
            });
        };

        var replaceAsync = function (element, options) {
            return popAsync().chain(function () {
                return self.pushAsync(element.getAttribute("name"), options);
            });
        };

        var clear = function () {
            $elem.children().each(function () {
                var $this = $(this);
                $this.removeClass("currently-active-state");
            });

            activeStates = [];
        };

        var setStatesAsync = function (newStates) {
            clear();

            return newStates.reduce(function (future, state) {
                return future.chain(function () {
                    return pushAsync(state.state, state.options);
                });
            }, Future.fromResult());
        };

        var updateState = function (options) {
            var stateToBeUpdated = activeStates[activeStates.length - 1];
            stateToBeUpdated.options = options;
            var controller = $(stateToBeUpdated.element).controller();
            invokeMethodIfExist(controller, "updateState", [options]);
        };

        var initialize = function () {
            // Go through the state manager, pulling out
            // each state.
            // If the element has a controller, try to call "init" on it.
            $elem.children().each(function () {
                var $this = $(this);
                var name = $this.attr("name");
                if (name) {
                    states[name] = this;
                } else {
                    throw new Error("All states need to have a 'name' attribute.");
                }
            });

            Object.keys(states).forEach(function (stateName) {
                var controller = $(states[stateName]).controller();
                invokeMethodIfExist(controller, "init", [self]);
            });

            setLayerPrecedence();
        };

        self.getActiveState = function () {
            var state = activeStates[activeStates.length - 1];
            return state;
        };

        self.getStateStack = function () {
            return activeStates.map(function (state) {
                return state.name;
            });
        };

        self.pushAsync = function (name, options) {
            var element = states[name];

            return pushAsync(element, options);
        };

        self.popAsync = function (options) {
            return popAsync(options);
        };

        self.replaceAsync = function (name, options) {
            return replaceAsync(states[name], options);
        };

        self.clear = function () {
            return clear();
        };

        self.getState = function (stateName) {
            return states[stateName];
        };

        self.setStatesAsync = function (stateNames) {
            var newStates = stateNames.map(function (state) {
                return { state: states[state.name], options: state.options };
            });
            return setStatesAsync(newStates);
        };

        self.updateState = function (options) {
            return updateState(options);
        };

        initialize();
    };
});