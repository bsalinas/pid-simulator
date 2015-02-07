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
	this.events = events;

	return this
};

Simulator.prototype.run= function(boiler_size, heater_size, pid_constants){
	var ctrl = new Controller(pid_constants.kp, pid_constants.ki, pid_constants.kd);
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
		
		var duty = ctrl.update(this.state.temperature);
		duty = Math.max(0,duty);
		duty = Math.min(1,duty);
		var dT = duty * heater_size * this.time_step / (boiler_size * 1000 * 4.186) - (this.time_step*1.0/60);
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
		toRet.push({time:this.state.time, temperature:this.state.temperature});
	}
	return toRet;
}




var Controller = function(k_p, k_i, k_d) {
  this.k_p = k_p || 1;
  this.k_i = k_i || 0;
  this.k_d = k_d || 0;

  this.sumError  = 0;
  this.lastError = 0;
  this.lastTime  = 0;

  this.target    = 0; // default value, can be modified with .setTarget
};

Controller.prototype.setTarget = function(target) {
  this.target = target;
};

Controller.prototype.update = function(current_value) {
  this.current_value = current_value;

  var error = (this.target - this.current_value);
  this.sumError = this.sumError + error;
  var dError = error - this.lastError;
  this.lastError = error;

  return (this.k_p*error) + (this.k_i * this.sumError) + (this.k_d * dError);
};