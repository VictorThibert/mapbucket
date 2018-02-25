function zoomed() {
  features.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  features.select(".boundary")
    .style("stroke-width", Math.pow(0.5 / d3.event.scale, 0.7) + "px");
  features.selectAll(".marker")  
    .style("stroke-width", Math.pow(0.5 / d3.event.scale, 0.7) + "px");
  features.selectAll("circle")
    .attr("r", function(d){
        return Math.sqrt(d['teu']) / 15 / Math.pow(d3.event.scale, 0.5)
      }) // exponent to slowly make circles bigger
}

let colorScale = d3.scale.linear().domain([0, 100]).range(["#ea765d", "#6e8fb7"]);


let zoom = d3.behavior.zoom()
  .translate([0,0])
  .scale(1)
  .scaleExtent([1,8])
  .on("zoom", zoomed);

let width = 960,
    height = 550;

// define projection and viewing bounds
let projection = d3.geo.naturalEarth()
    .scale(200)
    .translate([width / 2, height / 2 + 50]) // +50 for antarctica removal
    .precision(.1);

let path = d3.geo.path()
    .projection(projection);

let graticule = d3.geo.graticule();

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
      .attr("r", function(d){return Math.sqrt(d['teu'])/15 }) //consider proportional to square root
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
