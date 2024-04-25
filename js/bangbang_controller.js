
window.BangBangController = function() {
  this.target    = 0; // default value, can be modified with .setTarget
  this.hysteresis = 0.0;
  this.last_was_on = false;
};

BangBangController.prototype.setTarget = function(target) {
  this.target = target;
};

BangBangController.prototype.reset = function()
{
    
}
BangBangController.prototype.setHysteresis = function(hyst){
  this.hysteresis = hyst;
}
BangBangController.prototype.update = function(current_value) {
  // console.log(current_value,this.target,this.last_was_on, this.hysteresis)
  this.current_value = current_value;
  if(this.hysteresis > 0.0)
  {
      if(this.current_value >= this.target + this.hysteresis)
      {
        this.last_was_on = false;
        return 0
      } else if(this.current_value <= this.target - this.hysteresis)
      {
        this.last_was_on = true;
        return 1
      } else
      {
        return this.last_was_on
      }
  }else
  {
    

    if(this.current_value < this.target){
      this.last_was_on = true;
      return 1.0;
    }
    this.last_was_on = false;
    return 0.0;
  }
};