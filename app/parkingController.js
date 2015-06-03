'use strict';

angular.module('parkingApp')
    .controller('ParkingController', function ($scope, $http, $log, $filter) {
        $scope.message = 'Hello world!';

        var width = 1960,
            height = 1500;

        var fill = d3.scale.log()
            .domain([10, 500])
            .range(["brown", "steelblue"]);

        var path = d3.geo.path();

        var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height);

        d3.json("stadtkreisTopo.json", function(error, stadtkreise) {
            var featureCollection = topojson.feature(stadtkreise, stadtkreise.objects.stadtkreis);
            var bounds = d3.geo.bounds(featureCollection);
            var centerX = d3.sum(bounds, function(d) {return d[0];}) / 2,
                centerY = d3.sum(bounds, function(d) {return d[1];}) / 2;
            var projection = d3.geo.mercator()
                .scale(150000)
                .center([centerX, centerY]);
            path.projection(projection);


            svg.append("g")
                .attr("class", "stadtkreis")
                .selectAll("path")
                .data(topojson.feature(stadtkreise, stadtkreise.objects.stadtkreis).features)
                .enter().append("path")
                .attr("d", path)
                .style("fill", function(d) { return fill(path.area(d)); });

            //svg.append("path")
            //    .datum(topojson.mesh(stadtkreise, stadtkreise.objects.stadtkreis, function(a, b) {return a.id !== b.id; }))
            //    .attr("class", "states")
            //    .attr("d", path);
        });




    });