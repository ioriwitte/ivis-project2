// ------------------------
// Set Prosition for the graph
// ------------------------

// set the stage for the visualization
var margin = {top: 50, right: 80, bottom: 50, left: 50},
    w = 800 - margin.left - margin.right,
    h = 500 - margin.top - margin.bottom,
    x = d3.scale.linear().range([0, w]),
    y = d3.scale.linear().range([h, 0]);
    
var color = d3.scale.category10(); // to generate a different color for each line

// to be used later
var categories,
    transpose;

// where the line gets its properties, how it will be interpolated
var line = d3.svg.line()
                 .interpolate("basis")
                 .x(function(d) { return x(d.educationLevel); })
                 .y(function(d) { return y(d.stat); });

// add svg box where viz will go    
var svg = d3.select("#display_svg").append("svg")
            .attr("width", w + margin.left + margin.right)
            .attr("height", h + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// define the x axis and its class, append it to svg 
var xAxis = d3.svg.axis()
                  .scale(x)
                  .orient("bottom")
                  .ticks(5)
svg.append("svg:g")
   .attr("class", "x axis");

// define the y axis and its class, append it to svg
var yAxis = d3.svg.axis()
              .scale(y)
              .orient("left")
svg.append("svg:g")
   .attr("class", "y axis");

// ------------------------
// Update data
// ------------------------

// force data to update when year_period_menu is changed    
var year_period_menu = d3.select("#year_period_menu select").on("change", change);    

// put data from csv into categories variable
//run redraw function that will refresh whenever a new data series is selected 
d3.csv("data.csv", function(csv) {
    categories = csv;
    redraw();
});

d3.select(window)
  .on("keydown", function() { altKey = d3.event.altKey; })
  .on("keyup", function() { altKey = false; });

var altKey;

// set terms of transition that will take place
// when a new year period is chosen   
function change() {
  // clearTimeout(timeout);

  d3.transition()
    .duration(altKey ? 7500 : 1500)
    .each(redraw);
  }

// all the meat goes in the redraw function
function redraw() {
    
    // create data nests based on period of years
    var nested = d3.nest()
    .key(function(d) { return d.yearPeriodCode; })
    .map(categories)

    // get value from year_period_menu selection
    // the option values are set in HTML and correspond
    //to the [yearPeriodCode] value we used to nest the data 
    var series = year_period_menu.property("value");
    
    // only retrieve data from the selected series, using the nest we just created
    var data = nested[series];

    // for late use
    var average_total_gdp = data[0].averageTotalGDP;
    var stroke_width = Math.ceil(average_total_gdp / 1500);
    if(stroke_width<1) stroke_width = 1;
    
    // for object constancy we will need to set "keys", one for each catetory.
    // the keyring variable contains only the names of the categories
    var keyring = d3.keys(data[0]).filter(function(key) { 
        return (key !== "country" && key !== "countryCode" && key !== "yearPeriod" && key !== "yearPeriodCode" && key !== "educationLevel" && key !== "educationLevelCode");
    });
    
    // get the educationLevel and related statistics, map them to each categories separately 
    var transpose = keyring.map(function(name) {
          return {
            name: name,
            values: data.map(function(d) {
              return {educationLevel: d.educationLevel, stat: +d[name]};
            })
          };
      });

    // set the x and y domains as the max and min
    // of the related year and statistics, respectively
    x.domain([1, 5]);
    y.domain([0, 100]);

    // announce to d3 that we will be using something called
    // "category" that makes use of the transposed data 
    var category = svg.selectAll(".category")
      .data(transpose);
     
    // create separate groups for each category
    // assign them a class and individual IDs (for styling) 
    var categoryEnter = category.enter().append("g")
      .attr("class", "category")
      .attr("id", function(d) { return d.name; });
    
    // draw the lines and color them according to their names
    categoryEnter.append("path")
      .attr("fill", "none")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color(d.name); });

    // create lables for each categories
    // set their position to that of the last educationLevel and stat
    categoryEnter.append("text")
      .attr("class", "names")
      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.educationLevel) + "," + y(d.value.stat) + ")"; })
      .attr("x", 4)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

    // set variable for updating visualization
    var categoryUpdate = d3.transition(category);
    
    // change values of path to those of the new series
    categoryUpdate.select("path")
      .attr("d", function(d) { return line(d.values); })
      .attr("stroke-width", stroke_width);
    
    // change position of text alongside the moving path  
    categoryUpdate.select("text")
      .attr("transform", function(d) { return "translate(" + x(d.values[d.values.length - 1].educationLevel) + "," + y(d.values[d.values.length - 1].stat) + ")"; });
  
  // update the axes, though only the y axis will change    
    d3.transition(svg).select(".y.axis")
      .call(yAxis);   
          
    d3.transition(svg).select(".x.axis")
      .attr("transform", "translate(0," + h + ")")
      .call(xAxis);
          
// that concludes redraw()
}

// done!