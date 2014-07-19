module.exports = function(msg, fn){
  var done = function(){
    fn();
  };
  process.on('exit', done);
  return {
    clear: function(){
      process.removeListener('exit', done);
    }
  };
};
