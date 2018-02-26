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
let projection = d3.geoOrthographic()
  .scale(200)
  .clipAngle(90) // hide behind globe
  // .translate([width / 2, height / 2 + 50]) // +50 for antarctica removal
  .precision(.1);

// create path from projection
let path = d3.geoPath()
  .projection(projection);

let geoCircle = d3.geoCircle();

let graticule = d3.geoGraticule();


// create svg to house map
let svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  // .call(zoom)

// create features to house elements of the map
let features = svg.append("g")
var sens = 0.25;
features
  .append("path")
  .datum({type: "Sphere"})
  .call(d3.drag()
              .subject(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
              .on("drag", function() {
                var rotate = projection.rotate();
                projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
                features.selectAll(".country").attr("d", path);
                features.select(".boundary").attr("d", path);
                line.attr("d", path);
                features.selectAll("path.marker").attr("d",function(d) { 
        return path(geoCircle.center([d.lon, d.lat])
           .radius(Math.sqrt(d.teu/1000))())
      })
    }))
  .attr("class", "sphere")
  .attr("d", path)
  .attr("fill", "#d3ebf2")
  

var line = svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);



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
      .enter().append("path", ".graticule")
      .attr("class", "country")
      .attr("d", path)
      .call(d3.drag()
              .subject(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
              .on("drag", function() {
                var rotate = projection.rotate();
                projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
                features.selectAll(".country").attr("d", path);
                features.select(".boundary").attr("d", path);
                line.attr("d", path);
                features.selectAll("path.marker").attr("d",function(d) { 
        return path(geoCircle.center([d.lon, d.lat])
           .radius(Math.sqrt(d.teu/1000))())
      })
    }))
      .style("fill", "#DDD")
              

  features.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);

  d3.csv("../assets/top100ports2015withcoordinates.csv", function(data) {

    features.selectAll("path.marker")
      .data(data)
      .enter()
      .append("path")
      .attr("d", function(d) {
            return path(geoCircle
                .center([d.lon, d.lat])
                .radius(Math.sqrt(d.teu/1000))())
          }
        )
      .attr("class","marker")
      .style("fill", function(d){return colorScale(d['rank'])})
      .on("mouseover", function(d) {  
        tooltip.transition()    
          .duration(200)    
          .style("opacity", 1);    
        tooltip.html(d['rank'] + '<br>' + d['city']+ '<br>' + d['teu'])  
          .style("left", (d3.event.pageX) + "px")   
          .style("top", (d3.event.pageY - 28) + "px");  
        })          
      .on("mouseout", function(d) {   
        tooltip.transition()    
          .duration(500)    
          .style("opacity", 0); 
      })
      
  });
  // spinning_globe();
});

d3.select(self.frameElement).style("height", height + "px");

// adjust graphics on zoom
function zoomed() {
  features.attr("transform", d3.event.transform); // updated for d3 v
  features.select(".boundary")
    .style("stroke-width", Math.pow(0.5 / d3.event.transform.k, 0.7) + "px");
  features.selectAll(".marker")  
    .style("stroke-width", Math.pow(0.5 / d3.event.transform.k, 0.7) + "px");
  features.selectAll("path.marker")
    .attr("r", function(d){
        // exponent to slowly make circles bigger
        return Math.sqrt(d['teu']) / radiusDivider / Math.pow(d3.event.transform.k, 0.5)
      }) 
}


// automatic globe spinnging
var time = Date.now();
var rotate = [0, 0];
var velocity = [.01, -0];
function spinning_globe(){
   d3.timer(function(elapsed) {
      // get current time
      var dt = Date.now() - time;

      // get the new position from modified projection function
      projection.rotate([rotate[0] + velocity[0] * dt, rotate[1] + velocity[1] * dt]);

      // update cities position = redraw
      features.selectAll(".country").attr("d", path);
      features.select(".boundary").attr("d", path);

      features.selectAll("path.marker").attr("d",function(d) { 
        return path(geoCircle.center([d.lon, d.lat])
           .radius(Math.sqrt(d.teu/1000))())
      })
   });
}

function step() {
  console.log("What")

    d3.transition()
        .delay(250)
        .duration(1250)
        .tween("rotate", function() {
          var point = [-73.4,45.5],
              rotate = d3.interpolate(projection.rotate(), [-point[0], -point[1]]);

          return function(t) {
            projection.rotate(rotate(t));
            // line.attr("d", path);
            // country.attr("d", path);
            features.selectAll(".country").attr("d", path);
      features.select(".boundary").attr("d", path);
      line.attr("d", path);
      features.selectAll("path.marker").attr("d",function(d) { 
        return path(geoCircle.center([d.lon, d.lat])
           .radius(Math.sqrt(d.teu/1000))())
      })
          };
        })
      .transition()
       .on("end", step);
  }
