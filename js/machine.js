var startFromCold, brewing;
$(document).on('pagecontainershow', function (e, ui){

	$(ui.prevPage).remove();
	if(ui.toPage[0].id !== "selectMachine"){
		var shot = function(state, timestep){
			return (-1/60.0)*timestep;
		};
		brewing = new Simulator({time_step:10,sim_length:30*60, start_temperature:90}, [{start:30,stop:60,run:shot},{start:45,stop:75,run:shot}, {start:120,stop:150, run:shot},{start:300,stop:400, run:shot},{start:500,stop:700, run:shot}]);
		startFromCold = new Simulator({time_step:10,sim_length:30*60, start_temperature:40}, []);
		$(".pid-slider").on("slidestop", run);
		$('input[name="radio-scenario"]:radio').change(run);
		run();
	}
	


});
var svg, line;

function setupChart(data, events){

	var margin = {top: 20, right: 20, bottom: 30, left: 50};
	$('svg.chart').remove();
	svg = d3.select(".chart-wrapper").append('svg').attr('class','chart')
		.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	    // .attr("width", width + margin.left + margin.right)
	    // .attr("height", height + margin.top + margin.bottom)
	  


	var width = $('svg.chart').width() - margin.left - margin.right,
	    height = $('svg.chart').height() - margin.top - margin.bottom;


	var x = d3.scale.linear()
	    .range([0, width]);

	var y = d3.scale.linear()
	    .range([height, 0]);

	var xAxis = d3.svg.axis().ticks(5)
	    .scale(x)
	    .orient("bottom");

	var yAxis = d3.svg.axis().ticks(3)
	    .scale(y)
	    .orient("left");

	line = d3.svg.line()
	    .x(function(d) { return x(d.time/60); })
	    .y(function(d) {return y(d.temperature); });
	  var y_extent = d3.extent(data, function(d){return d.temperature;})
	  x.domain(d3.extent(data, function(d){return d.time/60;}));
	  y.domain([Math.min(y_extent[0],85), Math.max(y_extent[1],100)]);
	  console.log(x);

	  svg.selectAll('rect.shot').data(events)
	  	.enter().append('rect')
	  	.attr("class","shot")
	  	.attr('x',function(d){
	  		console.log(d);
	  		return x(d.start/60)
	  	})
	  	.attr('y',y(y.domain()[1]))
	  	.attr('width',function(d){
	  		return x(d.stop/60)-x(d.start/60);
	  	})
	  	.attr('height',y(y.domain()[0]) - y(y.domain()[1]));

	  svg.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);

	  svg.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 3)
	      .attr("dy", "-2.5em")
	      .style("text-anchor", "end")
	      .text("Temperature");
	  svg.append("rect")
	  	.attr('class','target')
	  	.attr('x',x(0)+2)
	  	.attr('y',y(96))
	  	.attr('width', (x(1800) - x(0)))
	  	.attr('height', y(94)-y(96))

	  

	var pathTween = function() {
        var interpolate = d3.scale.quantile()
                .domain([0,1])
                .range(d3.range(1, data.length + 1));
        return function(t) {
            return line(data.slice(0, interpolate(t)));
        };
    }
	  svg.selectAll('path.line').data([data]).enter()
	    .append("path")
	    .attr("class", "line")
	    .attr("d", line(data[0]))
	    .transition().duration(1000).attrTween('d',pathTween);
	    
    
    

}


function getConstants(){
	return {
		kp: $('[name="slider-kp"]').val(),
		ki: $('[name="slider-ki"]').val(),
		kd: $('[name="slider-kd"]').val()
	}
}

var run = function(e){
	var scenario_selected = $('[name="radio-scenario"]:checked')[0].id === 'radio-brewing'? brewing : startFromCold;

	var pid_constants = getConstants();
	var data = scenario_selected.run(getModel()['boiler']['volume'],getModel()['boiler']['power'], pid_constants);
	var i=0;
	setupChart(data, scenario_selected.events);
}



var step_size = 10;//seconds
var time_length = 30*60;//seconds
