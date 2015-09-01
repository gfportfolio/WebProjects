BASE.require([
    "Array.prototype.asQueryable",
    "BASE.collections.Hashmap"
], function () {

    var Hashmap = BASE.collections.Hashmap;
    var BACK = -1;
    var FORWARD = 1;

    BASE.namespace("components.ui.layouts");

    var ItemCache = function (cacheSize) {
        var self = this;
        var Future = BASE.async.Future;
        var queryable = [].asQueryable();
        var itemsByIndex = new Hashmap();
        var setItemCallbacks = new Hashmap();
        var outstandingQueryableRanges = [];
        var take = 50;
        var count = null;

        self.setTake = function (value) {
            take = value;
        };

        self.setQueryable = function (value) {
            queryable = value;
        };

        self.removeItemAtIndex = function (index) {
            itemsByIndex.remove(index);
        };

        self.setItemAtIndex = function (index, item) {
            itemsByIndex.add(index, item);
        };

        self.loadItem = function (index, setItem, setToLoading, direction) {
            if (count === 0) {
                return;
            }

            var item = itemsByIndex.get(index);
            var skip = index;

            if (item !== null) {
                setItem(item, index);
                return;
            }

            setItemCallbacks.add(index, setItem);
            setToLoading(index);

            var withinRange = outstandingQueryableRanges.some(function (range) {
                return index >= range.skip && index < range.skip + range.take;
            });

            if (withinRange) {
                return;
            }

            if (direction === BACK) {
                skip = index - take;
                skip = skip > 0 ? skip : 0;
            }

            var range = {
                skip: skip,
                take: take
            };

            outstandingQueryableRanges.push(range);

            queryable.skip(skip).take(take).toArray(function (items) {
                var rangeIndex = outstandingQueryableRanges.indexOf(range);
                if (rangeIndex > -1) {
                    outstandingQueryableRanges.splice(rangeIndex, 1);
                }

                items.forEach(function (item, itemIndex) {
                    var index = skip + itemIndex;
                    itemsByIndex.add(index, item);
                    var callback = setItemCallbacks.remove(index);

                    if (typeof callback === "function") {
                        callback(item, index);
                    }
                });
            });

        };

        self.clear = function () {
            count = null;
            itemsByIndex = new Hashmap();
            setItemCallbacks = new Hashmap();
            outstandingQueryableRanges = [];
        };

        self.getCount = function () {

            if (count !== null) {
                return Future.fromResult(count);
            }


            var expression = queryable.getExpression();
            var skipExpression = expression.skip;
            var skip = skipExpression === null ? 0 : skipExpression.children[0].value;

            return queryable.toArrayWithCount().chain(function (resultArrayWithCount) {
                var array = resultArrayWithCount.array;
                count = resultArrayWithCount.count;

                array.forEach(function (item, index) {
                    itemsByIndex.add(skip + index, item);
                });

                return count;
            });
        };
    };

    ItemCache.BACK = BACK;
    ItemCache.FORWARD = FORWARD;

    components.ui.layouts.ItemCache = ItemCache;

});