var MYNS2 = MYNS2 || {};
  MYNS2.subns = (function() {

  let colorScale = d3.scaleSqrt().domain([15, -15]).range(["#F56D55", "#6e8fb7"]);
  // set dimensions of graphic
  let width = 800;
  let height = 450;
  let radiusDivider = 10;
  let thousand = 100;

  // create zoom object
  let zoom = d3.zoom()
    // .translateExtent([[0, 0], [width, height]])
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

  // define projection and viewing bounds
  let projection = d3.geoNaturalEarth()
    .scale(160)
    .translate([width / 2 - 20, height / 2 + 18]) // +50 for antarctica removal
    .precision(.1);

  // create path from projection
  let path = d3.geoPath()
    .projection(projection);

  let graticule = d3.geoGraticule();

  // create svg to house map
  let svg = d3.select("#mainmap").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom)

      
  // create features to house elements of the map
  let features = svg.append("g");   

  // create tooltip div (invisible)
  let tooltip = d3.select("#mapHolder").append("div") 
    .attr("class", "tooltip")       
    .style("opacity", 0);

  // read in world coordinates
  d3.json("../assets/world_minus_antarctica.json", function(error, world) {
    if (error) throw error;

    let countries = topojson.feature(world, world.objects.countries).features;

    features.selectAll(".country")
        .data(countries)
      .enter().insert("path", ".graticule")
        .attr("class", "country")
        .attr("d", path)
        .style("fill", "#EEE");

    features.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path);

    drawCircles(2015);
    
  });

  // draw scatterplot points
  function drawCircles(year) {
    d3.csv("../assets/top100ports2015withcoordinates.csv", function(data) {
      features.selectAll(".marker")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "marker")
        .attr("cx", function(d){return projection([d['lon'],d['lat']])[0] })
        .attr("cy",function(d){return projection([d['lon'],d['lat']])[1] })
        .attr("r", function(d){return Math.sqrt(d['teu']) / radiusDivider }) //consider proportional to square root
        .style("fill", function(d){return colorScale(d['percent'])})
        .on("mouseover", function(d) { 
          MYNS.subns.step(d['lat'], d['lon']); // call globe spin
          d3.select(this).style("stroke", '#222') 
          tooltip.transition()    
            .duration(100)    
            .style("opacity", 1);    
          tooltip.html( '<b>City: </b>' + d['city']+ '<br><b>Rank: </b>' + d['rank'] + '<br><b>TEU: </b>' + d['teu']*thousand + '<br><b>Percent change: </b>' + d['percent'])  
            .style("left", (d3.event.pageX - 40) + "px")   
            .style("top", (d3.event.pageY - 75) + "px");  
          })          
        .on("mouseout", function(d) {  
          d3.select(this).style("stroke", '#FFF') 
          tooltip.transition()    
            .duration(500)    
            .style("opacity", 0); 
        });
    });
  }

  function updateData(year) {
    d3.csv("../assets/PORTS"+year+".csv", function(data) {
      features.selectAll("circle")
        .data(data)
        .transition()
        .style("fill", function(d){return colorScale(d['percent'])})
      features.selectAll("circle")
        .data(data) // Update with new data
        .attr("cx", function(d){return projection([d['lon'] , d['lat']])[0] })
        .attr("cy",function(d){return projection([d['lon'], d['lat']])[1] })
      features.selectAll("circle")
        .data(data)
        .transition()
        .duration(500)
        .attr("r", function(d){return Math.sqrt(d['teu']) / radiusDivider}) // Change size
        
    }); 
  }

  // legend components
  let verticalShift = 15;
  let legendRadius = d3.scaleSqrt()
      .domain([0, 40000  * thousand])
      .range([0, Math.sqrt(40000)/radiusDivider]);

  let legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (58) + "," + (height-9) + ")")
    .selectAll("g")
    .data([10000*thousand, 20000 * thousand, 40000 * thousand])
    .enter()
    .append("g");
  legend.append("text")
    .attr("y", function(d) { return - 2 * legendRadius(d);})
    .attr("dy", "1.3em")
    .text(d3.format(".1s"));
  legend.append("circle")
    .attr("cy", function(d) { return - legendRadius(d);})
    .attr("r", legendRadius);
  

  let colorLegendBlockWidth = 30;
  let colorLegend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (100) + "," + (height - 20) + ")")
    .selectAll("g")
    .data([-15, -10, -5 , 0, 5, 10, 15])
    .enter()
    .append("g");
  colorLegend.append("rect")
    .attr("width", colorLegendBlockWidth)
    .attr("height", 10)
    .attr("y", -verticalShift + 10)
    .attr("x", function(d, i) {return i * colorLegendBlockWidth})
    .style("fill", function(d) {return colorScale(d)})
    .style("opacity", 0.75)
  colorLegend.append("text")
    .attr("y", -verticalShift + 6)
    .attr("x", function(d, i) {return i * colorLegendBlockWidth * 1.05 + colorLegendBlockWidth / 2 - 3})
    .text(function(d) {return d + "%"});
  colorLegend.append("text")
    .attr("y", verticalShift)
    .attr("x", 70)
    .text("Percentage change year-over-year")

  // d3.select(self.frameElement).style("height", height + "px");

  // adjust graphics on zoom
  function zoomed() {
    features.attr("transform", d3.event.transform); // updated for d3 v
    features.select(".boundary")
      .style("stroke-width", Math.pow(0.5 / d3.event.transform.k, 0.7) + "px");
    features.selectAll(".marker")  
      .style("stroke-width", Math.pow(0.5 / d3.event.transform.k, 0.7) + "px");
    features.selectAll("circle")
      .attr("r", function(d){
          // exponent to slowly make circles bigger
          return Math.sqrt(d['teu']) / radiusDivider / Math.pow(d3.event.transform.k, 0.5)
        });

    legend.selectAll("circle")
      .attr("r", function(d){
        console.log(d)  
          return legendRadius(d) * Math.pow(d3.event.transform.k, 0.5)
        })
      .attr("cy", function(d) { return - legendRadius(d* d3.event.transform.k) ; })
    legend.selectAll("text")
      .attr("y", function(d) { console.log(d);return (- 2 * legendRadius(d* d3.event.transform.k)); })
  }

  // return public methods
    return {
      drawCircles: drawCircles,
      updateData: updateData
    }
})();
