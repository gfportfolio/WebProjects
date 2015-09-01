BASE.require([
    "jQuery",
    "components.ui.layouts.collections.ListLayout",
    "Array.prototype.asQueryable",
    "jQuery.fn.transition",
    "Array.prototype.except",
    "Array.prototype.intersect",
    "requestAnimationFrame",
    "BASE.collections.Hashmap",
    "components.ui.layouts.ItemCache"
], function () {

    var resizeTimeout = null;

    $(function () {
        $(window).resize(function () {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function () {
                $("[controller='components.ui.layouts.UICollection']").each(function () {
                    var $uiCollection = $(this);

                    $uiCollection.controller().resize();
                });
            }, 50);
        });
    });

    BASE.namespace("components.ui.layouts");

    var REFRESH_RATE = 1000 / 15;
    var ListLayout = components.ui.layouts.collections.ListLayout;
    var ItemCache = components.ui.layouts.ItemCache;
    var Future = BASE.async.Future;
    var Hashmap = BASE.collections.Hashmap;
    var emptyFuture = Future.fromResult();

    components.ui.layouts.UICollection = function (elem, tags) {
        var self = this;
        var $elem = $(elem);
        var content = tags["content"];
        var $content = $(content);

        var reusableEvent = jQuery.Event("scroll");
        var cachedTop = 0;
        var cachedLeft = 0;
        var cachedWidth = 0;
        var cachedHeight = 0;
        var cachedContentHeight = 0;
        var cachedContentWidth = 0;

        var totalCollectionLength = null;
        var currentIndexes = [];
        var scrollDirection = 1;

        var itemCache = new ItemCache(300);
        var elementFutures = new Hashmap();
        var availableElementFutures = [];
        var layout = null;
        var pixelBuffer = 500;
        var scrollHandlers = [];
        var resizeTimer = null;

        var currentIndexChanges = {
            removed: [],
            added: [],
            indexes: []
        };

        var contentRegion = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        };

        reusableEvent.top = 0;
        reusableEvent.left = 0;
        reusableEvent.zoom = 1;
        reusableEvent.preventDefault = function () { throw new Error("Cannot call this."); };
        reusableEvent.stopPropagation = function () { throw new Error("Cannot call this."); };

        var createItem = function () {
            var itemFuture;
            var itemController = "";
            if (layout.componentController) {
                itemController = 'controller="' + layout.componentController + '"';
            }

            var item = "<div tag=\"collectionItemContent\" " + itemController + "></div>";
            if (layout.component) {
                item = "<div tag=\"collectionItemContent\" component=\"" + layout.component + "\" " + itemController + "></div>";
            }

            itemFuture = BASE.web.components.createComponent("ui-collection-item", item).then(function (lastElement) {
                var $collectionItem = $(lastElement);
                var collectionItemController = $collectionItem.data("controller");
                var $item = $(collectionItemController.getItem());

                $item.css({
                    width: "100%",
                    height: "100%"
                });

                if ($collectionItem.parent().length === 0) {
                    $content.append($collectionItem);
                }

            });

            return itemFuture;
        };

        var getAvailableElementAsync = function (index) {
            var elementFuture = elementFutures.get(index);

            if (!(elementFuture instanceof Future)) {
                elementFuture = availableElementFutures.pop();
                elementFutures.add(index, elementFuture);
            }

            if (!(elementFuture instanceof Future)) {
                elementFuture = createItem();
                elementFutures.add(index, elementFuture);
            }

            return elementFuture;
        };

        var placeElementAsync = function (index, futureElement) {
            futureElement.then(function (element) {
                var $elment = $(element);
                var css = layout.getCss(index);

                $elment.attr("index", index);
                css["z-index"] = index + 1;

                var cssText = Object.keys(css).map(function (key) {
                    return key + ":" + css[key] + ";";
                }).join("");

                element.style.cssText = cssText;
            });
        };

        var loadItem = function (entity, index) {
            var elementFuture = elementFutures.get(index);

            if (elementFuture !== null) {
                setItem(elementFuture, entity, index);
            }
        };

        var setItem = function (elementFuture, entity, index) {
            elementFuture.then(function (element) {
                var itemController = $(element).controller();
                var listItem = itemController.getItem();

                var customController = $(listItem).controller();

                if (customController && typeof customController.setItem === "function") {
                    customController.setItem(entity, index);
                } else {
                    layout.prepareElement(listItem, entity, index);
                }
            });
        };

        var setItemToLoading = function (index) {
            var elementFuture = elementFutures.get(index);
            if (elementFuture !== null) {
                elementFuture.then(function (element) {
                    var itemController = $(element).controller();
                    var listItem = itemController.getItem();

                    var customController = $(listItem).controller();

                    if (customController && typeof customController.setLoading === "function") {
                        customController.setLoading();
                    } else if (layout && typeof layout.cleanElement === "function") {
                        layout.cleanElement(listItem);
                    }
                });
            }
        };

        var getIndexesOnScreen = function () {
            var top = self.top;
            var left = self.left;
            var width = self.width;
            var height = self.height;
            var indexes;

            var top = top - pixelBuffer;
            var bottom = self.top + height + pixelBuffer;

            if (top < 0) {
                bottom = bottom + Math.abs(top);
                top = 0;
            }

            contentRegion.top = top;
            contentRegion.right = left + width;
            contentRegion.bottom = bottom;
            contentRegion.left = left < 0 ? 0 : left;

            indexes = layout.getIndexes(contentRegion);


            return indexes;
        };

        var fixArrayToBounds = function (array) {
            while (array[0] < 0) {
                array.shift();
            }

            // This strips out indexes that are greater than the total collection length.
            while (array[array.length - 1] >= totalCollectionLength) {
                array.pop();
            }
        };

        var getIndexChanges = function () {
            var newCurrentIndexes = getIndexesOnScreen();
            var x, value;

            fixArrayToBounds(newCurrentIndexes);

            currentIndexChanges.added = newCurrentIndexes.except(currentIndexes);
            currentIndexChanges.removed = currentIndexes.except(newCurrentIndexes);

            if (currentIndexes.length > 0 && newCurrentIndexes > 0) {
                scrollDirection = currentIndexes[0] < newCurrentIndexes[0] ? 1 : -1;
            }

            currentIndexes = newCurrentIndexes;

            return currentIndexChanges;
        };

        var hideLoader = function () {
            console.log("Deprecated");
        };

        var showLoader = function () {
            console.log("Deprecated");
        };

        var setContentSize = function (collectionLength) {
            var width = layout.getWidth(collectionLength);
            var height = layout.getHeight(collectionLength);

            $content.css({
                width: width,
                height: height,
            });

            cachedContentHeight = content.clientHeight;
            cachedContentWidth = content.clientWidth;

            layout.scrollViewport.height = self.height;
            layout.scrollViewport.width = self.width;
        };

        var drawItems = function () {
            return itemCache.getCount().then(function (count) {
                requestAnimationFrame(function () {
                    totalCollectionLength = count;
                    setContentSize(count);
                    currentIndexes = getIndexesOnScreen();

                    fixArrayToBounds(currentIndexes);

                    elementFutures.getKeys().forEach(function (key) {
                        availableElementFutures.push(elementFutures.remove(key));
                    });

                    currentIndexes.forEach(function (index) {
                        var elementFuture = getAvailableElementAsync(index);
                        placeElementAsync(index, elementFuture);

                        itemCache.loadItem(index, loadItem, setItemToLoading, scrollDirection);
                    });

                    availableElementFutures.forEach(hideElement);

                });

            });
        };

        var prepareLayout = function () {
            cachedLeft = elem.scrollLeft;
            cachedTop = elem.scrollTop;
            cachedWidth = elem.clientWidth;
            cachedHeight = elem.clientHeight;

            return Future.fromResult();
        };

        var addItemWithIndex = function (index) {
            var elementFuture = getAvailableElementAsync(index);
            placeElementAsync(index, elementFuture);

            itemCache.loadItem(index, loadItem, setItemToLoading, scrollDirection);
        };

        var removeItemWithIndex = function (index) {
            var elementFuture = elementFutures.remove(index);
            availableElementFutures.push(elementFuture);
        };

        var hideElement = function (elementFuture) {
            elementFuture.then(function (element) {
                element.style.display = "none";
            });
        };

        var placeRecycledElements = function () {
            var indexChanges = getIndexChanges();
            var indexesToRemove = indexChanges.removed;
            var indexesToAdd = indexChanges.added;

            indexesToRemove.forEach(removeItemWithIndex);
            indexesToAdd.forEach(addItemWithIndex);
            availableElementFutures.forEach(hideElement);
        };

        var onScroll = function () {
            var event = createScrollEvent();
            placeRecycledElements();
            scrollHandlers.forEach(function (callback) {
                callback(event);
            });
        };

        var createScrollEvent = function () {
            cachedTop = reusableEvent.top = elem.scrollTop;
            cachedLeft = reusableEvent.left = elem.scrollLeft;
            reusableEvent.zoom = 1;
            return reusableEvent;
        };

        self.setPixelBuffer = function (count) {
            if (typeof count === "number") {
                pixelBuffer = count;
            }
        };

        self.setQueryableAsync = function (queryable) {
            queryable = queryable || [].asQueryable();

            //remove old items
            itemCache.clear();
            return prepareLayout().chain(function () {
                elem.top = 0;
                itemCache.setQueryable(queryable);
                return drawItems();
            });
        };

        self.setQueryable = function (queryable) {
            return self.setQueryableAsync(queryable).try();
        };

        self.reloadItemAtIndex = function (index) {
            return new Future(function (setValue) {
                itemCache.removeItemAtIndex(index);
                itemCache.loadItem(index, function (entity, index) {
                    loadItem(entity, index);
                    setValue();
                }, setItemToLoading, 1);
            }).try();
        };

        self.updateItemAtIndex = function (index, item) {
            itemCache.setItemAtIndex(index, item);
            loadItem(item, index);
        };

        self.reloadData = function () {
            itemCache.clear();
            return drawItems();
        };

        self.redrawItems = function () {
            prepareLayout().then(function () {
                drawItems();
            });
        };

        self.update = function () {
            //Force a data re-pull
            itemCache.clear();

            return prepareLayout().chain(function () {
                return drawItems();
            });
        };

        self.appendContent = function (element) {
            $content.append(element);
        };

        self.setLayout = function (value) {
            layout = value;
            itemCache.clear();
            prepareLayout().then(function () {
                drawItems();
            });
        };

        self.onScroll = function (callback) {
            if (typeof callback === "function") {
                scrollHandlers.push(callback);
            }
        };

        self.getLength = function () {
            return totalCollectionLength;
        }

        self.showLoader = showLoader;
        self.hideLoader = hideLoader;

        Object.defineProperties(self, {
            top: {
                get: function () {
                    return cachedTop;
                },
                set: function (value) {
                    elem.scrollTop = value;
                }
            },
            left: {
                get: function () {
                    return cachedLeft;
                },
                set: function (value) {
                    elem.scrollLeft = value;
                }
            },
            height: {
                get: function () {
                    return elem.clientHeight;
                }
            },
            width: {
                get: function () {
                    return elem.clientWidth;
                }
            },
            contentHeight: {
                get: function () {
                    return cachedContentHeight;
                }
            },
            contentWidth: {
                get: function () {
                    return cachedContentWidth;
                }
            }
        });

        self.resize = function () {
            //Throttle this event because it is called a ton.
            if (resizeTimer) {
                clearTimeout(resizeTimer);
            }

            resizeTimer = setTimeout(function () {
                // If the scroll isn't hidden.
                if (!$elem.is(":hidden")) {
                    //No need to clear the iteam cache here, we can reuse what we already have
                    self.redrawItems();
                };
            }, 350);

        };

        layout = new ListLayout({ height: 100 });

        $elem.on("scroll", onScroll);

    };
});