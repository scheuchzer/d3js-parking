angular.module('dataParser', []).config(['$provide', function ($provide) {
    $provide.factory('DataParser', ['$log', function ($log) {
        function cleanFeedForPlot(data) {
            var elementsPlusOtherStuff = data.children[0].children[0].children;
            var elementsWithoutStuff = cleanFeed(elementsPlusOtherStuff);
            var elements = extractInterestingInfo(elementsWithoutStuff);

            return elements;
        }

        function cleanFeed(elementsWithStuff) {
            var elementsWithoutStuff = [];
            for (var i = 0; i < elementsWithStuff.length; i++) {
                var element = elementsWithStuff[i];
                if (element.tagName === "item") {
                    elementsWithoutStuff.push(element);
                }
            }

            return elementsWithoutStuff;
        }

        function extractInterestingInfo(dirtyElements) {
            return dirtyElements.map(function (e) {
                var nameAdress = e.getElementsByTagName("title")[0].innerHTML;
                var status = e.getElementsByTagName("description")[0].innerHTML;

                return {
                    name: extractName(nameAdress),
                    freeSpaces: extractFreeSpaces(status)
                }
            });

            function extractName(nameAdress) {
                return nameAdress.split("/")[0].trim();
            }

            function extractFreeSpaces(status) {
                return Number.parseInt(status.split("/")[1].trim());
            }
        }


        return {
            parse: function (url, callback) {
                var parkings = {};
                d3.xml(url, "application/xml", function initializeParkings(error, data) {
                    var elements = cleanFeedForPlot(data);
                    elements.forEach(function (d) {
                        var name = d.name;
                        name = name.replace('Parkhaus ', '');
                        name = name.replace('Parkplatz ', '');
                        name = name.replace('Parkgarage am ', '');
                        parkings[name] = {name: name, free: d.freeSpaces};
                    });
                    callback(parkings);

                });
            }
        };


    }]);
}]);