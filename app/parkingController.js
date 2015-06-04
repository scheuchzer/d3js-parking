'use strict';

angular.module('parkingApp')
    .controller('ParkingController', function ($scope, $http, $log, $filter, $interval) {
        var centers = [];
        $scope.parkings = {};

        var width = 1000,
            height = 500;

        var color = d3.scale.linear().domain([0, 100]).range(['red', 'green']);
        var fill = d3.scale.log()
            .domain([10, 400])
            .range(["brown", "steelblue"]);

        var path = d3.geo.path();

        var svg = d3.select("#map").append("svg")
            .attr("width", width)
            .attr("height", height);

        var div = d3.select('#map').append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var stadtkreisText = d3.select('#map').append("div")
            .attr("class", "stadtkreisText")
            .style("opacity", 1);

        d3.json("stadtkreisTopo.json", function(error, stadtkreise) {
            var featureCollection = topojson.feature(stadtkreise, stadtkreise.objects.stadtkreis);
            var bounds = d3.geo.bounds(featureCollection);
            var centerX = d3.sum(bounds, function(d) {return d[0];}) / 2,
                centerY = d3.sum(bounds, function(d) {return d[1];}) / 2;
            var projection = d3.geo.mercator()
                .scale(150000)
                .center([centerX, centerY]);
            path.projection(projection);

            var zoom = d3.behavior.zoom()
                .translate(projection.translate())
                .scale(projection.scale())
                .scaleExtent([50000, 500000])
                .on("zoom", zoomed);

            featureCollection.features.forEach(function(d){
                var centerName = d.properties.Kname;
                var centerLoc = d.geometry;

                centers[centerName] = centerLoc;
            });


            var g = svg.append("g").call(zoom)
                .attr("class", "stadtkreis");
                g.selectAll("path")
                .data(topojson.feature(stadtkreise, stadtkreise.objects.stadtkreis).features)
                .enter().append("path")
                .attr("d", path).attr("name", function(d){
                    return d;
                    })
                .style("fill", function(d) { return fill(path.area(d)); })
                .on('mouseover', function(d,i){
                        var centerName = d.properties.Kname;
                        var center = centers[centerName];
                        center = path.centroid(center);
                        stadtkreisText.transition()
                        .duration(200)
                        .style("opacity", .6);
                        stadtkreisText.html(d.properties.Kname)
                        .style("left", center[0] + "px")
                        .style("top", center[1]+50 + "px");
                })
                .on('mouseout', function(d,i){
                    var centerName = d.properties.Kname;
                    var center = centers[centerName];
                    center = path.centroid(center);
                    stadtkreisText.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
            var pg = svg.append("g")
                .attr("class", "parking");



            d3.json("parkhaus.json", function(error, data) {
                pg.selectAll("circle")
                    .data(data.features)
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) {
                        var coords = d.geometry.coordinates;
                        return projection([coords[0], coords[1]])[0];
                    })
                    .attr("cy", function (d) {
                        var coords = d.geometry.coordinates;
                        return projection([coords[0], coords[1]])[1];
                    })
                    .attr("r", 5)
                    .on('mouseover', function(d,i){

                        var free = 'unbekannt';
                        var parking = $scope.parkings[d.properties.Name];
                        if (parking) {
                            free = parking.free;
                        }
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr('r', '15');
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(d.properties.Name
                            + '<br/>'
                            + d.properties.Adresse
                            + '<br/>'
                            + 'Frei: ' + free)
                            .style("left", (d3.event.pageX + 10 ) + "px")
                            .style("top", (d3.event.pageY ) + "px");
                    })

                    .on('mouseout', function(d,i){
                        d3.select(this)
                            .transition()
                            .duration(500)
                            .attr('r', '5');
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });

                $scope.$watch('parkings', function(){
                    pg.selectAll("circle")
                        .data(data.features)
                        .transition()
                        .duration(200)
                        .style("fill", function(d) {
                            var parking = $scope.parkings[d.properties.Name];
                            if (parking) {
                                return color(parking.free);
                            }
                            return 'gray';
                        });

                }, true);
            });


            function zoomed() {
                projection.translate(d3.event.translate).scale(d3.event.scale);
                g.selectAll("path").attr("d", path);
                pg.selectAll("circle")
                    .attr("cx", function (d) {
                        var coords = d.geometry.coordinates;
                        return projection([coords[0], coords[1]])[0];
                    })
                    .attr("cy", function (d) {
                        var coords = d.geometry.coordinates;
                        return projection([coords[0], coords[1]])[1];
                    })
                    .attr("r", 5);
            };

            d3.xml("rss.xml", "application/xml", initializeParkings);
            function initializeParkings(error, data) {
                var elements = cleanFeedForPlot(data);
                elements.forEach(function(d) {
                    var name = d.name;
                    name = name.replace('Parkhaus ','');
                    name = name.replace('Parkplatz ','');
                    name = name.replace('Parkgarage am ','');
                    $scope.parkings[name] = { name: name, free: d.freeSpaces};
                });
                $scope.$apply();

            }

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
                return dirtyElements.map(function(e) {
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



        });

        $interval(function(){
            angular.forEach($scope.parkings, function(d){
                d.free = Math.max(0, Math.round(d.free +Math.random()*40-20));
                $scope.parkings[d.name] = d;
            });

        }, 1000);

    });