BASE.require([
    "jQuery",
    "BASE.web.animation.ElementAnimation",
    "jQuery.fn.region",
    "components.material.animations.createFadeOutAnimation"
], function () {

    var ElementAnimation = BASE.web.animation.ElementAnimation;
    var createFadeOutAnimation = components.material.animations.createFadeOutAnimation;
    var Future = BASE.async.Future;

    BASE.namespace("components.material.inputs");

    components.material.inputs.MaterialButtonBehavior = function (elem, tags, scope) {
        var self = this;
        var $elem = $(elem);
        var ripple = tags['ripple'];
        var $ripple = $(ripple);
        var rippleFadeOutAnimation = createFadeOutAnimation(ripple);
        var fadeOutFuture = new Future.fromResult();
        var visibleState = {
            fadeAsync: function(){
                return rippleFadeOutAnimation.playToEndAsync();
            }
        }
        var invisibleState = {
            fadeAsync: function () {
                return Future.fromResult();
            }
        }
        currentState = invisibleState;

        var rippleAnimation = new ElementAnimation({
            target: ripple,
            easing: "easeOutQuad",
            properties: {
                scaleX: {
                    from: 0,
                    to: 1
                },
                scaleY: {
                    from: 0,
                    to: 1
                },
            },
            duration: 400
        });

        $elem.on('mousedown touchstart', function (event) {
            fadeOutFuture.cancel();
            var region = $elem.region();
            var x = event.pageX - region.left;
            var y = event.pageY - region.top;
            $ripple.css({
                top: y + 'px',
                left: x + 'px',
                marginTop: '-150px',
                marginLeft: '-150px',
                opacity: '1'
            });
            currentState = visibleState;
            rippleAnimation.restart();
        });

        $elem.on('mouseup touchend mouseleave touchleave', function () {
            fadeOutFuture = currentState.fadeAsync().try();
            currentState = invisibleState;
        });
    };

});