var debug = require('debug')('mvm:activate'),
  path = require('./path'),
  fs = require('fs-extra');

module.exports = function(pkg, fn){
  var bin = path.resolve(path.current(pkg) + '/bin');

  if(process.env.PATH.indexOf(bin) === -1){
    process.env.PATH = bin + ':' + process.env.PATH;
    debug('add PATH ' + bin);
  }

  fs.remove(path.current(pkg), function(){
    fs.symlink(path.dest(pkg), path.current(pkg), function(err){
      if(err) return fn(err);
      debug(path.current(pkg) + ' -> ' + path.dest(pkg));
      fn();
    });
  });
}
