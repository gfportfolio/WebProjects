BASE.require([
    "jQuery",
    "BASE.web.animation.ElementAnimation",
    "BASE.web.animation.PercentageTimeline"
], function () {

    var ElementAnimation = BASE.web.animation.ElementAnimation;
    var PercentageTimeline = BASE.web.animation.PercentageTimeline;

    BASE.namespace("components.material.feedback.PreloaderLine");

    components.material.feedback.PreloaderLine = function (elem, tags) {
        var self = this;
        var $elem = $(elem);
        var lineA = tags["line-a"];
        var $lineA = $(lineA);
        var lineB = tags["line-b"];
        var $lineB = $(lineB);
        var easing = "easeOutQuad";
        var duration = 1300;
        var classColors = $elem.attr("color-classes") || "background-info background-danger background-warning background-success";
        var classColorsArray = classColors.split(" ");
        var colorCount = classColorsArray.length;
        var timelineAnimation = new PercentageTimeline(duration * colorCount);

        var createScaleAnimation = function (target) {
            return new ElementAnimation({
                target: target,
                easing: easing,
                properties: {
                    scaleX: {
                        from: 0,
                        to: 1
                    }
                }
            });
        };

        var init = function () {
            $lineB.removeAttr("class").addClass("background-light");
            timelineAnimation.play();
            timelineAnimation.repeat = Infinity;
        };

        classColorsArray.forEach(function (classColor, index) {

            var $currentLine = index % 2 === 0 ? $lineA : $lineB;
            var $nextLine = $currentLine === $lineA ? $lineB : $lineA;
            var currentLineColor = classColor;

            //animate in next color
            var animation = createScaleAnimation($currentLine[0]);

            animation.observe("start", function () {
                $currentLine.css("z-index", 2);
                $nextLine.css("z-index", 1);


                //set color
                $currentLine.removeAttr("class").addClass(currentLineColor);
            });

            var start = index / colorCount;
            var end = index + 1 === colorCount ? 1 : ((index + 1) / colorCount);
            timelineAnimation.add({
                animation: animation,
                startAt: start,
                endAt: end
            });
        });

        self.play = function () {
            timelineAnimation.play();
            return this;
        };

        self.pause = function () {
            timelineAnimation.pause();
            return this;
        };

        self.stop = function () {
            timelineAnimation.stop();
            return this;
        };

        self.restart = function () {
            timelineAnimation.restart();
            return this;
        };

        self.seek = function (progress) {
            timelineAnimation.seek(progress);
            return this;
        };

        init();
    };
});