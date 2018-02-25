let colorScale = d3.scaleLinear().domain([0, 100]).range(["#ea765d", "#6e8fb7"]);
// set dimensions of graphic
let width = 960;
let height = 550;
let radiusDivider = 12

// create zoom object
let zoom = d3.zoom()
  .translateExtent([[0, 0], [width, height]])
  .scaleExtent([1, 8])
  .on("zoom", zoomed);

// define projection and viewing bounds
let projection = d3.geoNaturalEarth()
  .scale(200)
  .translate([width / 2, height / 2 + 50]) // +50 for antarctica removal
  .precision(.1);

// create path from projection
let path = d3.geoPath()
  .projection(projection);

let graticule = d3.geoGraticule();

// create svg to house map
let svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .call(zoom)
    
// create features to house elements of the map
let features = svg.append("g");   

// create tooltip div (invisible)
let tooltip = d3.select("body").append("div") 
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
      .style("fill", "#DDD");

  features.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);

  d3.csv("../assets/top100ports2015withcoordinates.csv", function(data) {
    features.selectAll(".markers")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "marker")
      .attr("cx", function(d){return projection([d['lon'],d['lat']])[0] })
      .attr("cy",function(d){return projection([d['lon'],d['lat']])[1] })
      .attr("r", function(d){return Math.sqrt(d['teu']) / radiusDivider }) //consider proportional to square root
      .style("fill", function(d){return colorScale(d['rank'])})
      .on("mouseover", function(d) {  
        tooltip.transition()    
          .duration(200)    
          .style("opacity", .9);    
        tooltip.html(d['rank'] + '<br>' + d['city']+ '<br>' + d['teu'])  
          .style("left", (d3.event.pageX) + "px")   
          .style("top", (d3.event.pageY - 28) + "px");  
        })          
      .on("mouseout", function(d) {   
        tooltip.transition()    
          .duration(500)    
          .style("opacity", 0); 
      });
  });
});

d3.select(self.frameElement).style("height", height + "px");

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
      }) 
}
