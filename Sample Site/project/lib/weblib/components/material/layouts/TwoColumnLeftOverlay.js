﻿BASE.require([
    "jQuery",
    "BASE.web.animation.ElementAnimation",
    "BASE.web.animation.PercentageTimeline"
], function () {

    var emptyFn = function () { };
    var ElementAnimation = BASE.web.animation.ElementAnimation;
    var PercentageTimeline = BASE.web.animation.PercentageTimeline;

    BASE.namespace("components.material.layouts");

    components.material.layouts.TwoColumnLeftOverlay = function (elem, tags, scope) {
        var self = this;
        var $elem = $(elem);
        var $leftColumn = $(tags['left-column']);
        var $rightColumn = $(tags['right-column']);
        var $rightColumnNonClickableRegion = $(tags['right-column-non-clickable-region']);
        var leftColumnVeil = tags['left-column-veil'];
        var $leftColumnVeil = $(leftColumnVeil);
        var leftColumnContent = tags['left-column-content'];
        var startX = 0;
        var startY = 0;
        var startTime = null;

        var getEvent = function (event) {
            event = event.originalEvent || event;
            if (event.targetTouches && event.targetTouches.length > 0) {
                event = event.targetTouches[0];
            } else if (event.changedTouches && event.changedTouches.length > 0) {
                event = event.changedTouches[0];
            }
            return event;
        };

        var leftColumnDiscoverState = {
            touchStart: function (event) {
                event = getEvent(event);

                startX = event.pageX;
                startY = event.pageY;

                startTime = Date.now();
            },
            touchMove: function (event) {
                event = getEvent(event);

                var diffX = event.pageX - startX;
                var diffY = Math.abs(event.pageY - startY);

                if (diffY > 5) {
                    leftColumnCurrentState = leftColumnScrollingState;
                } else if (diffX < -5) {
                    leftColumnCurrentState = leftColumnDraggingState;
                }
            },
            touchEnd: emptyFn,
            touchCancel: emptyFn
        };

        var leftColumnDraggingState = {
            touchStart: function (event) {
                event = getEvent(event);

                startX = event.pageX;
                startY = event.pageY;

                startTime = Date.now();

                leftColumnCurrentState = leftColumnDiscoverState;
            },
            touchMove: function (event) {
                event.preventDefault();
                event = getEvent(event);

                var diffX = event.pageX - startX;
                if (diffX <= 0) {
                    timeline.seek(1 - Math.abs(diffX) / 300).render();
                }
            },
            touchEnd: function (event) {
                event = getEvent(event);

                var diffX = event.pageX - startX;

                if (diffX < -200 || (Date.now() - startTime < 200 && diffX < 0)) {
                    hideLeftColumn();
                } else {
                    showLeftColumn();
                }

                leftColumnCurrentState = leftColumnDiscoverState;
            },
            touchCancel: function (event) {
                this.touchEnd(event);
            }
        };

        var leftColumnScrollingState = {
            touchStart: leftColumnDraggingState.touchStart,
            touchMove: emptyFn,
            touchEnd: function () {
                leftColumnCurrentState = leftColumnDiscoverState;
            },
            touchCancel: function () {
                leftColumnCurrentState = leftColumnDiscoverState;
            }
        };

        var leftColumnCurrentState = leftColumnDiscoverState;

        var leftColumnContentAnimation = new ElementAnimation({
            target: leftColumnContent,
            easing: "easeOutQuad",
            properties: {
                translateX: {
                    from: "-100%",
                    to: "0%"
                }
            }
        });

        var leftColumnVeilAnimation = new ElementAnimation({
            target: leftColumnVeil,
            easing: "linear",
            properties: {
                opacity: {
                    from: "0",
                    to: "1"
                }
            }
        });


        var timeline = new PercentageTimeline(300);
        timeline.add({
            animation: leftColumnContentAnimation,
            startAt: 0,
            endAt: 1
        }, {
            animation: leftColumnVeilAnimation,
            startAt: 0,
            endAt: 1
        });

        var showLeftColumn = function () {
            timeline.setTimeScale(1);
            timeline.play();
            $leftColumn.removeClass("hide");
        }

        var hideLeftColumn = function () {
            timeline.setTimeScale(2);
            timeline.reverse();
            var observer = timeline.observe("start", function () {
                $leftColumn.addClass("hide");
                observer.dispose();
            });
        }

        $leftColumnVeil.on("click", function () {
            hideLeftColumn();
        });

        $leftColumn.on("hideMenu", function (event) {
            event.stopPropagation();
            hideLeftColumn();
        });

        $leftColumn.on("touchstart", function (event) {
            leftColumnCurrentState.touchStart(event);
        });

        $leftColumn.on("touchmove", function (event) {
            leftColumnCurrentState.touchMove(event);
        });

        $leftColumn.on("touchend", function (event) {
            leftColumnCurrentState.touchEnd(event);
        });

        $leftColumn.on("touchcancel", function (event) {
            leftColumnCurrentState.touchCancel(event);
        });

        var rightColumnDiscoverState = {
            touchStart: function (event) {
                event = getEvent(event);

                startX = event.pageX;
                startY = event.pageY;

                if (startX < 15) {
                    $leftColumn.removeClass('hide');
                    timeline.seek(startX / leftColumnContent.offsetWidth).render();
                    rightColumnCurrentState = rightColumnDraggingState;
                }
            },
            touchMove: emptyFn,
            touchEnd: emptyFn,
            touchCancel: emptyFn
        };

        var rightColumnDraggingState = {
            touchStart: function (event) {
                event = getEvent(event);

                startX = event.pageX;
                startY = event.pageY;

                rightColumnCurrentState = rightColumnDiscoverState;
            },
            touchMove: function (event) {
                event.preventDefault();
                event = getEvent(event);

                var diffX = event.pageX - startX;

                timeline.seek(Math.abs(diffX) / leftColumnContent.offsetWidth).render();
            },
            touchEnd: function (event) {
                event = getEvent(event);

                var diffX = event.pageX - startX;

                if (diffX < 75) {
                    hideLeftColumn();
                } else {
                    showLeftColumn();
                }

                rightColumnCurrentState = rightColumnDiscoverState;
            },
            touchCancel: function (event) {
                this.touchEnd(event);
            }
        };

        var rightColumnCurrentState = rightColumnDiscoverState;

        $rightColumnNonClickableRegion.on("touchstart", function (event) {
            rightColumnCurrentState.touchStart(event);
        });

        $rightColumnNonClickableRegion.on("touchmove", function (event) {
            rightColumnCurrentState.touchMove(event);
        });

        $rightColumnNonClickableRegion.on("touchend", function (event) {
            rightColumnCurrentState.touchEnd(event);
        });

        $rightColumnNonClickableRegion.on("touchcancel", function (event) {
            rightColumnCurrentState.touchCancel(event);
        });

        self.showLeftColumn = showLeftColumn;
        self.hideLeftColumn = hideLeftColumn;
    };

});