BASE.require([
    "jQuery",
    "Element.prototype.empty"
], function (elem, tags) {

    BASE.namespace("components.tester");

    components.tester.ComponentTester = function (elem, tags) {
        var self = this;
        var $elem = $(elem);
        var $componentUrl = $(tags['component-url']);
        var $getComponentButton = $(tags["get-component"]);
        var $innerHtml = $(tags["inner-html"]);
        var $customScript = $(tags["custom-script"]);
        var loader = $(tags["loader"]).data("controller");
        var attributes = $(tags["attributes"]).data("controller");

        var saveToLocalStorage = function (url, html, attributes, customScript) {
            localStorage.lastEntry = JSON.stringify({
                url: url,
                html: html,
                attributes: attributes,
                customScript: customScript
            });
        };

        var loadFromLocalStorage = function () {
            if (localStorage.lastEntry) {
                var lastEntry = JSON.parse(localStorage.lastEntry);
                $componentUrl.val(lastEntry.url);
                $innerHtml.val(lastEntry.html);
                attributes.setAttributes(lastEntry.attributes || {});
                $customScript.val(lastEntry.customScript);
            }
        };

        $getComponentButton.on("click", function () {
            var url = $componentUrl.val();
            var html = $innerHtml.val();
            var attr = attributes.getAttributes();
            var customScript = $customScript.val();

            var script = document.createElement("script");
            script.type = "text/javascript";
            script.innerText = customScript;

            var head = document.getElementsByTagName("head")[0];
            head.appendChild(script);

            saveToLocalStorage(url, html, attr, customScript);

            loader.loadComponent(url, html, attr).then(function (lastElement) {
                // This will allow for methods to be call via console.
                window.controller = $(lastElement).data("controller");
                window.component = lastElement;
                $(window).trigger('componentLoaded'); // I know this is lame Jared but added for convenience.
            });
        });

        $componentUrl.on("keydown", function (e) {
            if (e.which === 13) {
                $getComponentButton.triggerHandler({ type: "click" });
            }
        });

        $elem.on("enteredView", function () {
            setTimeout(function () {
                loadFromLocalStorage();
            }, 300);
        });
    };


});