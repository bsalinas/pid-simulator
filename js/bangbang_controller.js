window.BangBangController = function() {
  this.target    = 0; // default value, can be modified with .setTarget
};

BangBangController.prototype.setTarget = function(target) {
  this.target = target;
};

BangBangController.prototype.update = function(current_value) {
  this.current_value = current_value;

  if(this.current_value < this.target){
    return 1.0;
  }
  return 0.0;
};