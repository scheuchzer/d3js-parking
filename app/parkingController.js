'use strict';

angular.module('parkingApp')
    .controller('ParkingController', function ($scope, $http, $log, $filter) {
        var centers = [];

        var width = 1960,
            height = 1500;

        var fill = d3.scale.log()
            .domain([10, 500])
            .range(["brown", "steelblue"]);

        var path = d3.geo.path();

        var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height);

        var div = d3.select('body').append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var stadtkreisText = d3.select('body').append("div")
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
                    .style("fill", "red")
                    .on('mouseover', function(d,i){
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .style('fill', 'green')
                            .attr('r', '10');
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(d.properties.Name + '<br/>'+ d.properties.Adresse)
                            .style("left", (d3.event.pageX + 10 ) + "px")
                            .style("top", (d3.event.pageY ) + "px");
                    })

                    .on('mouseout', function(d,i){
                        d3.select(this)
                            .transition()
                            .duration(500)
                            .style('fill', 'red').attr('r', '5');
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });
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
            }

        });


    });