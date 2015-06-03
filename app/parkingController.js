'use strict';

angular.module('parkingApp')
    .controller('ParkingController', function ($scope, $http, $log, $filter) {
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


            var g = svg.append("g")
                .attr("class", "stadtkreis");
                g.selectAll("path")
                .data(topojson.feature(stadtkreise, stadtkreise.objects.stadtkreis).features)
                .enter().append("path")
                .attr("d", path)
                .style("fill", function(d) { return fill(path.area(d)); });
            var pg = svg.append("g")
                .attr("class", "parking");

            d3.json("parkhaus.json", function(error, data) {
                pg.selectAll("circle")
                    .data(data.features)
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) {
                        console.log(d);
                        var coords = d.geometry.coordinates;
                        return projection([coords[0], coords[1]])[0];
                    })
                    .attr("cy", function (d) {
                        var coords = d.geometry.coordinates;
                        return projection([coords[0], coords[1]])[1];
                    })
                    .attr("r", 5)
                    .style("fill", "red")
                    .on('mouseover', function(d,i){
                        d3.select(this).style('fill', 'green').attr('r', '10');
                    })
                    .on('mouseout', function(d,i){
                        d3.select(this).style('fill', 'red').attr('r', '5');
                    });
            });


        });




    });