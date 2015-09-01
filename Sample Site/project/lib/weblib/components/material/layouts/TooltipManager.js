BASE.require([
    "jQuery",
    "BASE.web.animation.ElementAnimation",
    "BASE.web.animation.PercentageTimeline",
    "BASE.async.Fulfillment",
    "jQuery.fn.region"
], function () {
    var ElementAnimation = BASE.web.animation.ElementAnimation;
    var PercentageTimeline = BASE.web.animation.PercentageTimeline;
    var Fulfillment = BASE.async.Fulfillment;
    var Future = BASE.async.Future;
    var emptyFn = function () { };

    var recoverFuture = function (future) {
        return future.catch(emptyFn).catchCanceled(emptyFn);
    };

    BASE.namespace("components.material.layouts");

    components.material.layouts.TooltipManager = function (elem, tags, scope) {
        var self = this;
        var $elem = $(elem);
        var $message = $(tags["message"]);
        var $tooltip = $(tags["tooltip"]);
        var lastPositionFuture = Future.fromResult();

        var showMessageAsync = function () {
            var opacityAnimation = new ElementAnimation({
                target: tags["tooltip"],
                properties: {
                    opacity: {
                        from: 0,
                        to: 1
                    }
                }
            });

            var translateYAnimation = new ElementAnimation({
                target: tags["tooltip"],
                properties: {
                    translateY: {
                        from: "50px",
                        to: "0px"
                    }
                },
                easing: "easeOutExpo"
            });

            var timeline = new PercentageTimeline(500);
            timeline.add({
                animation: opacityAnimation,
                startAt: 0,
                endAt: 1
            }, {
                animation: translateYAnimation,
                startAt: 0,
                endAt: 1
            });

            return timeline.playToEndAsync();
        };

        var hideMessageAsync = function () {
            var opacityAnimation = new ElementAnimation({
                target: tags["tooltip"],
                properties: {
                    opacity: {
                        from: 1,
                        to: 0
                    }
                }
            });

            return opacityAnimation.playToEndAsync();
        };

        self.showTooltipAsync = function (options) {
            var position = options.position;
            var messageElement = options.messageElement;
            var message = options.message;
            var width = options.width;

            return lastPositionFuture = recoverFuture(lastPositionFuture.cancel()).chain(function () {
                $message.empty();
                if (messageElement) {
                    $message.append(messageElement);
                } else {
                    $message.text(message);
                }

                $tooltip.css({
                    display: "block",
                    transform: "translateY(0)",
                    width: width || ""
                });

                var height = $tooltip.region().height;
                position.top = position.top - (height / 2);
                position.left = position.left + 20;
                $tooltip.offset(position);

                return showMessageAsync();
            });
        };

        self.hideTooltipAsync = function () {
            return lastPositionFuture = recoverFuture(lastPositionFuture.cancel()).chain(function () {
                return hideMessageAsync().finally(function () {
                    $tooltip.css({
                        display: "none"
                    });
                });
            });
        };

        $elem.on("tooltip", function (event) {
            if (!(event.tooltipManagerAsync instanceof Fulfillment)) {
                throw new Error("The event needs to have a Fulfillment on the tootipManager property.");
            }
            event.tooltipManagerAsync.setValue({
                showAsync: function (options) {
                    return self.showTooltipAsync(options);
                },
                hideAsync: function () {
                    return self.hideTooltipAsync();
                }
            });
            return false;
        });

    };
});