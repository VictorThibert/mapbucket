let mapNamespace = {};
  mapNamespace.subns = (function() {

  let margin = {top: 23, right: 10, bottom: 20, left: 10};
  let colorScale = d3.scaleSqrt().domain([15, -15]).range(["#F56D55", "#6e8fb7"]);
  let width = 800 - margin.left - margin.right;
  let height = 490 - margin.top - margin.bottom;
  let radiusDivider = 10;
  let thousand = 100;
  let sourceText = "Source: Maritime Intelligence - Lloyd's List (2015, 2016)";
  let title = "The World's Busiest Cargo Ports ";
  let transform = 1;
  let zoomK = 1;



  // create zoom object
  let zoom = d3.zoom()
    // .translateExtent([[0, 0], [width, height]])
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

  // define projection and viewing bounds
  let projection = d3.geoNaturalEarth()
    .scale(160)
    .translate([width / 2 - 20, height / 2 + margin.top * 2]) // +50 for antarctica removal
    .precision(.1);

  // create path from projection
  let path = d3.geoPath()
    .projection(projection);

  let graticule = d3.geoGraticule();

  // create svg to house map
  let svg = d3.select("#mainmap").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
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
    d3.csv("../assets/PORTS2016.csv", function(data) {
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
          globeNamespace.subns.step(d['lat'], d['lon']); // call globe spin
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
        .attr("r", function(d){return Math.sqrt(d['teu']) / radiusDivider /  Math.pow(zoomK, 0.5)}) // Change size
        
    }); 
  }

  // legend components
  let verticalShift = 75; // down all bottom elements
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
    .attr("class", "numbers")
    .attr("y", function(d) { return - 2 * legendRadius(d) - 20 + verticalShift- margin.top*2; })
    .attr("dy", "1.3em")
    .text(d3.format(".1s"));
  legend.append("circle")
    .attr("cy", function(d) { return - legendRadius(d)  - 20 + verticalShift - margin.top*2;})
    .attr("r", legendRadius);
  legend.append("text")
    .attr("y",  -5 + verticalShift - margin.top*2)
    .attr("x", 0)
    .text("TEU ")
  

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
    .attr("y",  -20 + verticalShift - margin.top*2)
    .attr("x", function(d, i) {return i * colorLegendBlockWidth})
    .style("fill", function(d) {return colorScale(d)})
    .style("opacity", 0.75)
  colorLegend.append("text")
    .attr("y",  -25 + verticalShift - margin.top*2)
    .attr("x", function(d, i) {return i * colorLegendBlockWidth * 1.05 + colorLegendBlockWidth / 2 - 3})
    .text(function(d) {return d + "%"});
  colorLegend.append("text")
    .attr("y", 5+  verticalShift - margin.top*2)
    .attr("x", 70)
    .text("Percentage change year-over-year")


  // in map source
  let inMapSource = svg.append("g")
    .attr("class", "inMapSource")
    .attr("transform", "translate(" + (width/1.25) + "," + (height + verticalShift - margin.top*3) + ")")
    .append("text")
    .text(sourceText)

  let inMapTitle = svg.append("g")
    .attr("class", "inMapTitle")
    .attr("transform", "translate(" + (margin.left*3) + "," + (margin.top*2.2) + ")")
    .append("text")
    .style("text-anchor", "start")
    .text(title)


  // adjust graphics on zoom
  function zoomed() {  
    transform = d3.event.transform;  
    zoomK = d3.event.transform.k;
  
    features.attr("transform", transform); // updated for d3 v
    features.select(".boundary")
      .style("stroke-width", Math.pow(0.5 / zoomK, 0.7) + "px");
    features.selectAll(".marker")  
      .style("stroke-width", Math.pow(0.5 / zoomK, 0.7) + "px");
    features.selectAll("circle")
      .attr("r", function(d){
          // exponent to slowly make circles bigger
          return Math.sqrt(d['teu']) / radiusDivider / Math.pow(zoomK, 0.5)
        });

    legend.selectAll("circle")
      .attr("r", function(d){
          return legendRadius(d) * Math.pow(zoomK, 0.5)
        })
      .attr("cy", function(d) { return - legendRadius(d *zoomK) - 20 + verticalShift - margin.top*2; })
    legend.selectAll("text.numbers")
      .attr("y", function(d) { return (- 2 * legendRadius(d* zoomK)) - 20 + verticalShift - margin.top*2; })
  }

  function updateTitle(year) {
    inMapTitle
      .text(title + "(" + year + ")")
  }



  // return public methods
    return {
      drawCircles: drawCircles,
      updateData: updateData,
      updateTitle: updateTitle
    }
})();
