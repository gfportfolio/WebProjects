BASE.require([
    "jQuery",
    "BASE.async.Future"
], function () {
    BASE.namespace('components.material.segues');

    var Future = BASE.async.Future;
    components.material.segues.DisappearInstantSegue = function () {
        var self = this;
        var duration = 0;

        self.getDuration = function () {
            return duration;
        }

        self.executeAsync = function (outboundElement, inboundElement) {
            var $outboundElement = $(outboundElement);
            var $inboundElement = $(inboundElement);

            $outboundElement.css({
                "opacity": 1,
                "tranform": ""
            });

            $inboundElement.css({
                "opacity": 0,
                "tranform": ""
            });

            return Future.fromResult();
        };
    };

});