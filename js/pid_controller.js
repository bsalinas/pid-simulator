window.PIDController = function(k_p, k_i, k_d, time_step) {
  this.k_p = k_p || 1;
  this.k_i = k_i || 0;
  this.k_d = k_d || 0;
  this.time_step = time_step;
  this.sumError  = 0;
  this.lastError = 0;
  this.lastTime  = 0;

  this.target    = 0; // default value, can be modified with .setTarget
};

PIDController.prototype.reset = function()
{
    this.sumError = 0;
    this.lastError = 0;
    this.lastTime = 0;
}
PIDController.prototype.setTarget = function(target) {
  this.target = target;
};
PIDController.prototype.setConstants = function(constants){
  this.k_p = constants.kp;
  this.k_i = constants.ki;
  this.k_d = constants.kd;
}
PIDController.prototype.update = function(current_value) {
  this.current_value = current_value;

  var error = (this.target - this.current_value);
  this.sumError = this.sumError + (error*this.time_step);
  var dError = (error - this.lastError)/this.time_step;
  this.lastError = error;

  return (this.k_p*error) + (this.k_i * this.sumError) + (this.k_d * dError);
};