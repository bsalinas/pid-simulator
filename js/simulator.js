/**
 *  Controller: AttachmentLandingController
 *    View controller for the content on the attachment page.
 */
window.Simulator = function(opts, events){
	this.state={};
	this.time_step = opts.time_step || 60;
	this.sim_length = opts.sim_length || 1800;
	this.start_temperature = opts.start_temperature || 85;
	this.target_temperature = opts.target_temperature || 95;
	this.room_temperature = opts.room_temperature || 20;//Celsius
	this.time_delay = opts.time_delay || 10;
	this.events = events;
	this.last_controls_time = 0;
	this.last_heater_duty_cycle = 0;
    this.heater_duty_cycle_pending = []
    this.last_calculated_heater_duty_cycle = 0
    // let n_delay = parseInt(1.0/this.time_step)
    let n_delay = parseInt(this.time_delay/this.time_step)
    for(let i=0; i<n_delay; i++)
    {
        this.heater_duty_cycle_pending.push(0.0)
    }

	return this
};
Simulator.prototype.setTimeDelay = function(time_delay_s)
{
	this.heater_duty_cycle_pending = [];
	this.time_delay = time_delay_s;
	console.log("time delay is ",this.time_delay)
	let n_delay = parseInt(this.time_delay/this.time_step)
	if(n_delay < 1) n_delay = 1
    for(let i=0; i<n_delay; i++)
    {
        this.heater_duty_cycle_pending.push(0.0)
    }
}
Simulator.prototype.run= function(boiler, ctrl, controls_time_step){
	var boiler_size = boiler['volume'];
	var heater_size = boiler['power'];
    ctrl.reset();
	var surface_area = 2*3.14159*boiler['radius']*boiler['length'] + 2*3.14159*Math.pow(boiler['radius'],2);
	var h = 7.9;//(W/m^2 K)
	// var ctrl = new Controller(pid_constants.kp, pid_constants.ki, pid_constants.kd);
	ctrl.setTarget(this.target_temperature);
	// ctrl.update(75);
	var toRet = [], i=0;
	this.state = {
		temperature: this.start_temperature,
		time: 0.0
	};

	while(this.state.time<this.sim_length){
		//Q = m*c*dT
		//m = liters * 1000
		// c = 4.186 Joules/ gram
		// Q = duty * heater_watts * timestep(s) (should be in joules)
		if(this.state.time == 0 || (this.state.time - this.last_controls_time) >= controls_time_step){
            let new_duty_cycle = ctrl.update(this.state.temperature, this.state);
            new_duty_cycle = Math.max(0,new_duty_cycle);
            new_duty_cycle = Math.min(1,new_duty_cycle);
            this.state.heater_duty_cycle = new_duty_cycle;
            this.last_heater_duty_cycle = this.heater_duty_cycle_pending.shift()
            this.heater_duty_cycle_pending.push(new_duty_cycle);
			// this.last_heater_duty_cycle = 
			// this.last_heater_duty_cycle = Math.max(0,this.last_heater_duty_cycle);
			// this.last_heater_duty_cycle = Math.min(1,this.last_heater_duty_cycle);
			this.last_controls_time = this.state.time;
		}
		
		//dQ/dt = h*A(T(t) - T_env)
		var cooling = h * surface_area*(this.state.temperature-this.room_temperature);
		var dT = (this.last_heater_duty_cycle * heater_size - cooling) * this.time_step / (boiler_size * 1000 * 4.186);
		this.state.cooling = cooling
		

		var toAdd = 0.0;
		for(i=0; i<this.events.length; i++){
			var thisEvent = this.events[i];
			if(this.state.time <= thisEvent.stop && this.state.time >= thisEvent.start){
				toAdd+=thisEvent.run(this.state, this.time_step);
			}
		}
		dT+=toAdd;

		this.state.temperature = this.state.temperature + dT;
		this.state.time = this.state.time + this.time_step;
		toRet.push({...this.state});
	}
	return toRet;
}




