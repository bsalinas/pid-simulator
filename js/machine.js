var startFromCold, brewing;
var TIME_STEP = 0.1
var pid_controller = new PIDController(1,1,1, TIME_STEP);
var currentScenario = false;
var bang_bang_controller = new BangBangController();
var currentController = bang_bang_controller;

function parseQueryString(params)
{
    console.log("parseQueryString")
    console.log(params)
    if(params["sim"])
    {
        $('[data-scenario="'+params["sim"]+'"]').trigger('click');
    } else
    {
        $('#scenario li:first a').trigger('click');
    }
    if(params["ctrl"])
    {
        $('[data-controller="'+params["ctrl"]+'"]').trigger('click');
    } else
    {
        $('[data-controller="bang_bang"]').trigger('click');
    }
    if(params["kp"])
    {
        $('[name="slider-kp"]').val(params["kp"])
    }
    if(params["ki"])
    {
        $('[name="slider-ki"]').val(params["ki"])
    }
    if(params["kd"])
    {
        $('[name="slider-kd"]').val(params["kd"])
    }
    if(params["room_temp"])
    {
    	$('[name="slider-room-temp"]').val(params["room_temp"]);
    }
    if(params["hyst"])
    {
    	$('[name="slider-hyst"]').val(params["hyst"]);
    }
    if(params["power"])
    {
    	$('[name="slider-power"]').val(params["power"]);
    }
    if(params["volume"])
    {
    	$('[name="slider-volume"]').val(params["volume"]);
    }
}
$(document).ready( function (e){

	var shot = function(state, timestep){
		return (-2/60.0)*timestep;
	};
	brewing = new Simulator({room_temperature:getRoomTemp(), time_step:TIME_STEP,sim_length:30*60, start_temperature:94}, [{start:80,stop:110,run:shot},{start:95,stop:125,run:shot}, {start:150,stop:180, run:shot},{start:330,stop:430, run:shot},{start:530,stop:730, run:shot}]);
	startFromCold = new Simulator({room_temperature:getRoomTemp(), time_step:TIME_STEP,sim_length:60*60, start_temperature:90}, []);
	
	$('a[data-scenario]').click(function(e){
		if($(this).attr('data-scenario') === 'brewing'){
			currentScenario = brewing;
		}
		else{
			currentScenario = startFromCold;
		}
        // $(".pid-slider").on("change", run);
		run();
	});
	$('a[data-controller]').click(function(e){
		console.log($(this).attr('data-controller'))
		console.log("Clicked on Controller");
		if($(this).attr('data-controller') == 'bang_bang'){
			currentController = bang_bang_controller;
		}
		else{
			currentController = pid_controller;
		}
        // $(".pid-slider").on("change", run);
		run();
	});
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    console.log(getModel())
    $('[name="slider-volume"]').val(getModel()["boiler"]["volume"])
    $('[name="slider-power"]').val(getModel()["boiler"]["power"])
    parseQueryString(params);
	// $('#scenario li:first a').trigger('click');

    $(".pid-slider").on("change", run);
    // $(".param-slider").on("change", run);
	run();

});
var svg, line;

function setupChart(data,events)
{
	let subsample = data.filter(function(value, index, Arr){
		return index%20 == 0;
	});
	var layout = {
		autosize: true,
  		height: 300
	};
	var temperature_trace = {
	  y: subsample.map((x) => x.temperature),
	  x: subsample.map((x) => x.time),
	  name:"Temperature",
	  mode: 'markers',
	  type:"scatter",
	  yaxis:'y2',
	  marker: {
	    size: subsample.map((x) => x.heater_duty_cycle > 0 ? 7 : 8),
	    color: subsample.map((x) => x.heater_duty_cycle),
	    colorscale: [[0, 'rgb(200,200,200)'],[0.1, 'rgb(50,0,0)'],  [1, 'rgb(255,0,0)']],
	    line:{width:0}
	  },
	  text: subsample.map((x)=> Number(x.temperature).toFixed(1)+"°C, "+Number(x.heater_duty_cycle*100).toFixed(1)+" %"),
	  hoverlabel:{bgcolor:"#FFFFFF", font:{color:"#000"}}


	};
	var setpoint_trace = {
		y:subsample.map((x)=>x.target),
		x: subsample.map((x) => x.time),
		mode: 'markers',
		type:"scatter",
		name:"Setpoint",
		yaxis:'y2',
		marker:{
			size:2,
			color:"#888"
		}
	}
	console.log(setpoint_trace)

	// var allTraces = [setpoint_trace, temperature_trace];
	// Plotly.newPlot('chart-wrapper', allTraces, layout);

	// if("p" in subsample[0])
	// {
	// 	//pid
	// 	let heatmap = {
	// 		x: subsample.map((x) => x.time),
	// 		z: [subsample.map((x)=>x.p+x.i+x.d),subsample.map((x)=>x.p),subsample.map((x)=>x.i),subsample.map((x)=>x.d)],
	// 		y: ["All","P","I","D"],
	// 		type: 'heatmap',
	// 		colorscale:[[0,'rgb(0,0,255)'],[0.5,'rgb(255,255,255)'],[1,'rgb(255,0,0)']],
	// 		zmin:-1,
	// 		zmax:1

	// 	}
	// 	console.log(heatmap)
	// 	Plotly.newPlot('pid-chart-wrapper',[heatmap])
	// }

	if("p" in subsample[0])
	{
		//pid
		let bar_p = {
			x: subsample.map((x) => x.time),
			y: subsample.map((x)=>x.p),
			yaxis:'y1',
			name: "P",
			type:"bar",
			marker:{
				color:"#c1e7ff",
				opacity:0.5,
				line:{
					width:0
				}
			}
		}
		let bar_i = {
			x: subsample.map((x) => x.time),
			y: subsample.map((x)=>x.i),
			yaxis:'y1',
			name: "I",
			type:"bar",
			marker:{
				color:"#488f31",
				opacity:0.2,
				line:{
					width:0
				}
			}
		}
		let bar_d = {
			x: subsample.map((x) => x.time),
			y: subsample.map((x)=>x.d),
			yaxis:'y1',
			name: "D",
			type:"bar"
			// mode: 'markers',
			// type:"scatter"
		}
		let bar_traces = [bar_d, bar_i, bar_p, temperature_trace, setpoint_trace]
		let bar_layout = {
			barmode:"stack",
			autosize: true,
			yaxis1:{
				title:"PID Contribution",
				side:"right"	
			},
			yaxis2:{
				title:"Temperature",
				side:"left",
				overlaying:"y",
				range:[90,100]
			}
  			// height: 400
  		}
		Plotly.newPlot('pid-chart-wrapper',bar_traces, bar_layout)
	}

}

// function setupChart(data, events){

// 	var margin = {top: 20, right: 20, bottom: 30, left: 50};
// 	$('svg.chart').remove();
// 	svg = d3.select(".chart-wrapper").append('svg').attr('class','chart')
// 		.append("g")
// 	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
// 	    // .attr("width", width + margin.left + margin.right)
// 	    // .attr("height", height + margin.top + margin.bottom)
	  


// 	var width = $('svg.chart').width() - margin.left - margin.right,
// 	    height = $('svg.chart').height() - margin.top - margin.bottom;


// 	var x = d3.scale.linear()
// 	    .range([0, width]);

// 	var y = d3.scale.linear()
// 	    .range([height, 0]);

// 	var xAxis = d3.svg.axis().ticks(5)
// 	    .scale(x)
// 	    .orient("bottom");

// 	var yAxis = d3.svg.axis().ticks(3)
// 	    .scale(y)
// 	    .orient("left");

// 	line = d3.svg.line()
// 	    .x(function(d) { return x(d.time/60); })
// 	    .y(function(d) {return y(d.temperature); });
// 	  var y_extent = d3.extent(data, function(d){return d.temperature;})
// 	  x.domain(d3.extent(data, function(d){return d.time/60;}));
// 	  y.domain([Math.min(y_extent[0],92), Math.max(y_extent[1],97)]);
// 	  console.log(x);

// 	  svg.selectAll('rect.shot').data(events)
// 	  	.enter().append('rect')
// 	  	.attr("class","shot")
// 	  	.attr('x',function(d){
// 	  		console.log(d);
// 	  		return x(d.start/60)
// 	  	})
// 	  	.attr('y',y(y.domain()[1]))
// 	  	.attr('width',function(d){
// 	  		return x(d.stop/60)-x(d.start/60);
// 	  	})
// 	  	.attr('height',y(y.domain()[0]) - y(y.domain()[1]));

// 	  svg.append("g")
// 	      .attr("class", "x axis")
// 	      .attr("transform", "translate(0," + height + ")")
// 	      .call(xAxis);

// 	  svg.append("g")
// 	      .attr("class", "y axis")
// 	      .call(yAxis)
// 	    .append("text")
// 	      .attr("transform", "rotate(-90)")
// 	      .attr("y", 3)
// 	      .attr("dy", "-2.5em")
// 	      .style("text-anchor", "end")
// 	      .text("Temperature");
// 	  svg.append("rect")
// 	  	.attr('class','target')
// 	  	.attr('x',x(0)+2)
// 	  	.attr('y',y(95.5))
// 	  	.attr('width', (x(1800) - x(0)))
// 	  	.attr('height', y(94.5)-y(95.5))

	  

// 	var pathTween = function() {
//         var interpolate = d3.scale.quantile()
//                 .domain([0,1])
//                 .range(d3.range(1, data.length + 1));
//         return function(t) {
//             return line(data.slice(0, interpolate(t)));
//         };
//     }
// 	  svg.selectAll('path.line').data([data]).enter()
// 	    .append("path")
// 	    .attr("class", "line")
// 	    .attr("d", line(data[0]))
// 	    .transition().duration(1000).attrTween('d',pathTween);
	    
    
    

// }


function getConstants(){
	return {
		kp: $('[name="slider-kp"]').val(),
		ki: $('[name="slider-ki"]').val(),
		kd: $('[name="slider-kd"]').val()
	}
}
function getRoomTemp(){
	return parseFloat($('[name="slider-room-temp"]').val());
}
function getHysteresis(){
	return parseFloat($('[name="slider-hyst"]').val());
}
function getPower(){
	return parseFloat($('[name="slider-power"]').val());
}
function getVolume(){
	return parseFloat($('[name="slider-volume"]').val());
}
function generateQueryString()
{
    console.log("generateQueryString")
    let ctrl = $("[data-controller].ui-btn-active").attr("data-controller")
    let sim = $("[data-scenario].ui-btn-active").attr("data-scenario")
    let params = {
        "ctrl":ctrl,
        "sim":sim,
        "room_temp":getRoomTemp(),
        "volume":getVolume(),
        "power":getPower()
    }
    if(sim == "pid")
    {
        params["kp"] = $('[name="slider-kp"]').val()
        params["ki"] = $('[name="slider-ki"]').val()
        params["kd"] = $('[name="slider-kd"]').val()
    } else
    {
    	params["hyst"] = $('[name="slider-hyst"]').val()
    }

    let queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + queryString;
    console.log(queryString)
    // window.history.replaceState(null,null,"?"+queryString)
    // window.history.replaceState(null,null,newurl);
    $('#deep_link').attr("href",newurl);
}
function jsonToCsv(items) {
  const header = Object.keys(items[0]);
  const headerString = header.join(',');
  // handle null or undefined values here
  const replacer = (key, value) => value ?? '';
  const rowItems = items.map((row) =>
    header
      .map((fieldName) => JSON.stringify(row[fieldName], replacer))
      .join(',')
  );
  // join header and body, and break into separate lines
  const csv = [headerString, ...rowItems].join('\r\n');
  return csv;
}
var run = function(e){
    console.log("RUN!");
	var pid_constants = getConstants();
	pid_controller.k_i = pid_constants.ki;
	pid_controller.k_p = pid_constants.kp;
	pid_controller.k_d = pid_constants.kd;

	console.log("hyst is "+getHysteresis());
	bang_bang_controller.setHysteresis(getHysteresis());
	// currentScenario.room_temperature = getRoomTemp();
	// console.log(currentController);
	let model = getModel()
	model["boiler"]["volume"] = getVolume()
	model["boiler"]["power"] = getPower()
	var data = currentScenario.run(model['boiler'], currentController, TIME_STEP);//XXX this is wrong
    generateQueryString();
	var i=0;
	setupChart(data, currentScenario.events);
	var kpis = calculateKPIs(data);
	// console.log(kpis);
	if(typeof kpis.rise_time === 'string'){
		$('#riseTime .stat').text(kpis.rise_time);	
	}
	else{
		$('#riseTime .stat').text(kpis.rise_time+"s");	
	}

	if(typeof kpis.settling_time === 'string'){
		$('#settling .stat').text(kpis.settling_time);	
	}
	else{
		$('#settling .stat').text(parseFloat(Math.round(kpis.settling_time * 10) / 10).toFixed(1)+"s");
	}
	if(typeof kpis.offset === 'string'){
		$('#finaltemp .stat').text(kpis.offset);
	}
	else{
		$('#finaltemp .stat').html(parseFloat(Math.round(kpis.offset * 10) / 10).toFixed(1)+"&deg;C");	
	}
	
	// $('#stability .stat').text(parseFloat(Math.round(kpis.stability * 10) / 10).toFixed(1)+"%");
	
	
	$('#overshoot .stat').html(parseFloat(Math.round(kpis.peak_overshoot * 10) / 10).toFixed(1)+"&deg;C");
	let text = jsonToCsv(data);
	$('#download_button').attr("href","data:text/csv;charset=utf-8,"+text)
}

var calculateKPIs = function(data){
	var i=0;
	var riseTime = "Not Reached";
	var hasReachedTemp = false;
	var lastOutOfRange = "Not Reached";
	var settling_time;
	var avgTemp = 0.0;
	var inRangeCount=0, outOfRangeCount = 0;
	var max = 0;
	var threshold_min =  currentScenario.target_temperature - (currentScenario.target_temperature - currentScenario.start_temperature)*0.2;
	var threshold_max = currentScenario.target_temperature + (currentScenario.target_temperature - currentScenario.start_temperature)*0.2;// + currentScenario.start_temperature;
	console.log(threshold_min);
	console.log(threshold_max);
	for(i=0; i<data.length; i++){
		if(!hasReachedTemp){
			if(data[i].temperature >= threshold_min){
				riseTime = data[i].time;
				hasReachedTemp = true;
			}
		} else {
			if(Math.abs(data[i].temperature - currentScenario.target_temperature) < 2.5){
				inRangeCount++;
			}
			else{
				outOfRangeCount++;	
			}
		}
	}
	for(i=0; i<data.length; i++){
		// console.log(data[i].temperature);
		if(data[i].temperature <= threshold_min || data[i].temperature >= threshold_max){
			lastOutOfRange = i;//data[i].time;
		}
	}
	for(i=lastOutOfRange; i<data.length; i++){
		avgTemp+= data[i].temperature;
	}
	if((data.length - lastOutOfRange)* currentScenario.time_step < 60){
		avgTemp = "Unstable";
		settling_time = "Unstable";

	}
	else{
		avgTemp = (avgTemp / (data.length - lastOutOfRange)) - currentScenario.target_temperature;	
		settling_time = data[lastOutOfRange].time;
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
		peak_overshoot: max,
		stability: 100*inRangeCount/(inRangeCount+outOfRangeCount),
		settling_time: settling_time,
		offset: avgTemp
	};
}



var step_size = 0.1;//seconds
var time_length = 30*60;//seconds
