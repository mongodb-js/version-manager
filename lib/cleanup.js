var debug = require('debug')('mvm:cleanup');

module.exports = function(msg, fn){
  var done = function(){
    debug('running uncleared: %s', msg);
    fn();
  };

  process.on('exit', done);
  return {
    clear: function(){
      process.removeListener('exit', done);
    }
  };
};
