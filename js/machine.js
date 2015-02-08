var startFromCold, brewing;
var pid_controller = new PIDController(1,1,1);
var currentScenario = false;
var bang_bang_controller = new BangBangController();
var currentController = bang_bang_controller;
$(document).on('pagecontainershow', function (e, ui){

	$(ui.prevPage).remove();
	if(ui.toPage[0].id !== "selectMachine"){
		var shot = function(state, timestep){
			return (-1/60.0)*timestep;
		};
		brewing = new Simulator({time_step:1,sim_length:30*60, start_temperature:90}, [{start:30,stop:60,run:shot},{start:45,stop:75,run:shot}, {start:120,stop:150, run:shot},{start:300,stop:400, run:shot},{start:500,stop:700, run:shot}]);
		startFromCold = new Simulator({time_step:1,sim_length:120*60, start_temperature:40}, []);
		$(".pid-slider").on("slidestop", run);
		$('#scenario a').click(function(e){
			if($(this).attr('data-scenario') === 'brewing'){
				currentScenario = brewing;
			}
			else{
				currentScenario = startFromCold;
			}
			run();
		});
		$('#controls a').click(function(e){
			console.log($(this).attr('data-controller'))
			if($(this).attr('data-controller') == 'bang_bang'){
				currentController = bang_bang_controller;
			}
			else{
				currentController = pid_controller;
			}
			run();
		});
		$('#scenario li:first a').trigger('click');
		// run();
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
	  	.attr('y',y(95.5))
	  	.attr('width', (x(1800) - x(0)))
	  	.attr('height', y(94.5)-y(95.5))

	  

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

	var pid_constants = getConstants();
	pid_controller.k_i = pid_constants.ki;
	pid_controller.k_p = pid_constants.kp;
	pid_controller.k_d = pid_constants.kd;
	console.log(currentController);
	var data = currentScenario.run(getModel()['boiler'], currentController, 30);
	var i=0;
	setupChart(data, currentScenario.events);
	var kpis = calculateKPIs(data);
	console.log(kpis);
}

var calculateKPIs = function(data){
	var i=0;
	var riseTime = "Not Reached";
	var max = 0;
	var threshold = (currentScenario.target_temperature - currentScenario.start_temperature)*0.9 + currentScenario.start_temperature;
	for(i=0; i<data.length; i++){
		if(data[i].temperature >= threshold){
			riseTime = data[i].time;
			break;
		}
	}

	for(i=0; i<data.length; i++){
		if(data[i].temperature > currentScenario.target_temperature){
			max = Math.max(max, data[i].temperature);	
		}
	}
	if(max !== 0){
		max = max - currentScenario.target_temperature;
	}
	
	

	return {
		rise_time: riseTime,
		peak_overshoot: max
	};
}



var step_size = 10;//seconds
var time_length = 30*60;//seconds
