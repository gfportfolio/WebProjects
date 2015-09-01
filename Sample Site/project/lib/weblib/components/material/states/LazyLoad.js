BASE.require([
    "jQuery",
    "BASE.web.components",
    "BASE.async.Future",
    "BASE.async.delayAsync",
    "BASE.util.invokeMethodIfExists",
    "BASE.util.invokeMethodIfExistsAsync",
    "components.material.animations.createFadeInAnimation",
    "components.material.animations.createFadeOutAnimation"
], function () {

    var Future = BASE.async.Future;
    var invokeMethodIfExists = BASE.util.invokeMethodIfExists;
    var invokeMethodIfExistsAsync = BASE.util.invokeMethodIfExistsAsync;
    var delayAsync = BASE.async.delayAsync;
    var createFadeInAnimation = components.material.animations.createFadeInAnimation;
    var createFadeOutAnimation = components.material.animations.createFadeOutAnimation;

    BASE.namespace('components.material.states');

    components.material.states.LazyLoad = function (elem, tags, scope) {
        var self = this;
        var $elem = $(elem);
        var $appendedElement = $();
        var appendedElementController = {};
        var $preloader = $elem.children(':first-child');
        var delayAmount = 500;

        var createComponentFuture = BASE.web.components.createComponent($elem.attr('lazy-load')).chain(function (elem) {
            $appendedElement = $(elem);
            appendedElementController = $appendedElement.controller() || {};
            invokeMethodIfExists(appendedElementController, 'init', [self.stateManagerController]);
            return elem;
        });

        var delayFuture = $preloader.length === 0 ? Future.fromResult() : delayAsync(delayAmount);

        var createStateAsync = Future.all([createComponentFuture, delayFuture]).chain(function (resultArray) {
            return resultArray[0];
        });

        self.init = function (stateManagerController) {
            self.stateManagerController = stateManagerController;
        }

        self.prepareToActivateAsync = function () {
            return createStateAsync.chain(function () {

                var preloaderFuture = Future.fromResult();

                if ($preloader.parent().length === 1) {
                    $preloader.css({ position: "absolute", top: 0, left: 0});
                    $elem.append($appendedElement);

                    var fadePreloaderFuture = createFadeOutAnimation($preloader[0], 100).playToEndAsync().chain(function () {
                        $preloader.remove();
                    });

                    var fadeAppendedElement = createFadeInAnimation($appendedElement[0], 100);
                    var fadeInElementFuture = fadeAppendedElement.playToEndAsync();

                    preloaderFuture = Future.all([fadePreloaderFuture, fadeInElementFuture]);

                } else {
                    $elem.append($appendedElement);
                }

                var prepareToActivateFuture = invokeMethodIfExistsAsync(appendedElementController, 'prepareToActivateAsync', arguments);

                return Future.all([preloaderFuture, prepareToActivateFuture]);
            });
        };

        self.activated = function () {
            invokeMethodIfExists(appendedElementController, 'activated', arguments);
        };

        self.updateState = function () {
            invokeMethodIfExists(appendedElementController, 'updateState', arguments);
        };

        self.prepareToDeactivateAsync = function () {
            return invokeMethodIfExistsAsync(appendedElementController, 'prepareToDeactivateAsync', arguments);
        };

        self.deactivated = function () {
            invokeMethodIfExists(appendedElementController, 'deactivated', arguments);
            $appendedElement.detach();
        };

        self.getChildElementAsync = function () {
            return createStateAsync;
        };

    }
});